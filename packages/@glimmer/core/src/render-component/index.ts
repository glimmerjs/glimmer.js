import { setPropertyDidChange } from '@glimmer/tracking';
import {
  clientBuilder,
  renderJitComponent,
  JitRuntimeFromProgram,
  EnvironmentDelegate,
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

import { ComponentRootReference, PathReference } from '@glimmer/reference';
import { ComponentDefinition } from '../managers/component/custom';

import { SimpleElement, SimpleDocument } from '@simple-dom/interface';
import { RuntimeProgramImpl } from '@glimmer/program';

export interface RenderComponentOptions {
  element: Element;
  args?: Dict<unknown>;
  meta?: unknown;
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

  const { element, args } = options;
  const document = self.document as SimpleDocument;

  const iterator = getTemplateIterator(
    ComponentClass,
    element,
    { document },
    new ClientEnvDelegate(),
    args
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
const program = new RuntimeProgramImpl(context.program.constants, context.program.heap);

function dictToReference(dict: Dict<unknown>, env: Environment): Dict<PathReference> {
  return Object.keys(dict).reduce((acc, key) => {
    acc[key] = new ComponentRootReference(dict[key], env);
    return acc;
  }, {} as Dict<PathReference>);
}

export function getTemplateIterator(
  ComponentClass: ComponentDefinition,
  element: Element | SimpleElement,
  envOptions: EnvironmentOptions,
  envDelegate: EnvironmentDelegate,
  componentArgs: Dict<unknown> = {}
): TemplateIterator {
  const runtime = JitRuntimeFromProgram(envOptions, program, resolver, envDelegate);
  const builder = clientBuilder(runtime.env, {
    element,
    nextSibling: null,
  } as GlimmerCursor);

  const handle = resolver.registerRoot(ComponentClass);

  return renderJitComponent(
    runtime,
    builder,
    context,
    0,
    handle,
    dictToReference(componentArgs, runtime.env)
  );
}
