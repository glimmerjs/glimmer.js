import { setPropertyDidChange } from '@glimmer/tracking';
import {
  clientBuilder,
  renderJitComponent,
  JitRuntime,
  EnvironmentDelegate,
  DefaultDynamicScope,
} from '@glimmer/runtime';
import {
  Cursor as GlimmerCursor,
  RenderResult,
  Dict,
  TemplateIterator,
  Environment,
  EnvironmentOptions,
} from '@glimmer/interfaces';
import { JitContext } from '@glimmer/opcode-compiler';

import { ClientEnvDelegate } from '../environment/delegates';
import { CompileTimeResolver, RuntimeResolver } from './resolvers';

import { ComponentRootReference, PathReference, ConstReference } from '@glimmer/reference';
import { ComponentDefinition } from '../managers/component/custom';

import { OWNER_KEY, DEFAULT_OWNER } from '../owner';
import { SimpleElement, SimpleDocument } from '@simple-dom/interface';

export interface RenderComponentOptions {
  element: Element;
  args?: Dict<unknown>;
  owner?: object;
}

type ResolveFn = () => void;
type RejectFn = (error: Error) => void;

let renderNotifiers: Array<[ResolveFn, RejectFn]> = [];

export function didRender(): Promise<void> {
  if (scheduled) {
    return new Promise((resolve, reject) => {
      renderNotifiers.push([resolve, reject]);
    });
  }
  return Promise.resolve();
}

async function renderComponent(
  ComponentClass: ComponentDefinition,
  options: RenderComponentOptions
): Promise<void>;
async function renderComponent(
  ComponentClass: ComponentDefinition,
  element: HTMLElement
): Promise<void>;
async function renderComponent(
  ComponentClass: ComponentDefinition,
  optionsOrElement: RenderComponentOptions | HTMLElement
): Promise<void> {
  const options: RenderComponentOptions =
    optionsOrElement instanceof HTMLElement ? { element: optionsOrElement } : optionsOrElement;

  const { element, args, owner } = options;
  const document = self.document as SimpleDocument;

  const iterator = getTemplateIterator(
    ComponentClass,
    element,
    { document },
    new ClientEnvDelegate(),
    args,
    owner
  );
  const result = iterator.sync();
  results.push(result);
}

export default renderComponent;

const results: RenderResult[] = [];

setPropertyDidChange(scheduleRevalidation);

let scheduled = false;
function scheduleRevalidation(): void {
  if (scheduled) {
    return;
  }

  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    try {
      revalidate();
      renderNotifiers.forEach(([resolve]) => resolve());
    } catch (err) {
      renderNotifiers.forEach(([, reject]) => reject(err));
    }

    renderNotifiers = [];
  }, 0);
}

function revalidate(): void {
  for (const result of results) {
    const { env } = result;
    env.begin();
    result.rerender();
    env.commit();
  }
}

const resolver = new RuntimeResolver();
const context = JitContext(new CompileTimeResolver(resolver));

function dictToReference(dict: Dict<unknown>, env: Environment): Dict<PathReference> {
  const root = new ComponentRootReference(dict, env);

  return Object.keys(dict).reduce((acc, key) => {
    acc[key] = root.get(key);
    return acc;
  }, {} as Dict<PathReference>);
}

export function getTemplateIterator(
  ComponentClass: ComponentDefinition,
  element: Element | SimpleElement,
  envOptions: EnvironmentOptions,
  envDelegate: EnvironmentDelegate,
  componentArgs: Dict<unknown> = {},
  owner = DEFAULT_OWNER
): TemplateIterator {
  const runtime = JitRuntime(envOptions, envDelegate, context, resolver);
  const builder = clientBuilder(runtime.env, {
    element,
    nextSibling: null,
  } as GlimmerCursor);

  const handle = resolver.registerRoot(ComponentClass);

  let dynamicScope;

  if (owner) {
    dynamicScope = new DefaultDynamicScope({
      [OWNER_KEY]: new ConstReference(owner),
    });
  }

  return renderJitComponent(
    runtime,
    builder,
    context,
    0,
    handle,
    dictToReference(componentArgs, runtime.env),
    dynamicScope
  );
}
