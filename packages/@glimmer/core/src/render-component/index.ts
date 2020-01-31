import { setPropertyDidChange } from '@glimmer/tracking';
import { Environment } from '@glimmer/application';
import {
  clientBuilder,
  renderJitComponent,
  CustomJitRuntime,
  DefaultDynamicScope,
} from '@glimmer/runtime';
import { Cursor as GlimmerCursor, RenderResult, Dict } from '@glimmer/interfaces';
import { JitContext } from '@glimmer/opcode-compiler';

import { CompileTimeResolver, RuntimeResolver } from './resolvers';

import { RootReference, PathReference } from '@glimmer/reference';
import { ComponentFactory } from '../managers/component/custom';

import { PUBLIC_DYNAMIC_SCOPE_KEY } from '../scope';

export interface RenderComponentOptions {
  element: Element;
  args?: Dict<unknown>;
  scope?: Dict<unknown>;
}

type ResolveFn = () => void;
type RejectFn = (error: Error) => void;

let renderNotifiers: Array<[ResolveFn, RejectFn]> = [];

export function didRender() {
  if (scheduled) {
    return new Promise((resolve, reject) => {
      renderNotifiers.push([resolve, reject]);
    });
  }
  return Promise.resolve();
}

async function renderComponent(
  ComponentClass: ComponentFactory,
  options: RenderComponentOptions
): Promise<void>;
async function renderComponent(
  ComponentClass: ComponentFactory,
  element: HTMLElement
): Promise<void>;
async function renderComponent(
  ComponentClass: ComponentFactory,
  optionsOrElement: RenderComponentOptions | HTMLElement
): Promise<void> {
  const options: RenderComponentOptions =
    optionsOrElement instanceof HTMLElement ? { element: optionsOrElement } : optionsOrElement;
  const { element, scope, args } = options;
  const iterator = getTemplateIterator(ComponentClass, element, args, scope);
  const result = iterator.sync();
  results.push(result);
}

export default renderComponent;

const results: RenderResult[] = [];

setPropertyDidChange(scheduleRevalidation);

let scheduled = false;
function scheduleRevalidation() {
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

function revalidate() {
  for (let result of results) {
    const { env } = result;
    env.begin();
    result.rerender();
    env.commit();
  }
}

const resolver = new RuntimeResolver();
const context = JitContext(new CompileTimeResolver(resolver));

export function dictToReference(dict?: Dict<unknown>): Dict<PathReference> {
  if (!dict) {
    return {};
  }

  return Object.keys(dict).reduce(
    (acc, key) => {
      acc[key] = new RootReference(dict[key]);
      return acc;
    },
    {} as Dict<PathReference>
  );
}

function getTemplateIterator(
  ComponentClass: ComponentFactory,
  element: Element,
  componentArgs?: Dict<unknown>,
  scope?: Dict<unknown>
) {
  const env = Environment.create();
  const runtime = CustomJitRuntime(resolver, context, env);
  const builder = clientBuilder(runtime.env, {
    element,
    nextSibling: null,
  } as GlimmerCursor);

  let handle = resolver.registerRoot(ComponentClass);

  let dynamicScope;

  if (scope) {
    dynamicScope = new DefaultDynamicScope({
      [PUBLIC_DYNAMIC_SCOPE_KEY]: new RootReference(scope),
    });
  }

  return renderJitComponent(
    runtime,
    builder,
    context,
    0,
    handle,
    dictToReference(componentArgs),
    dynamicScope
  );
}
