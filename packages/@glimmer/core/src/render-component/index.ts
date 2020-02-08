import { setPropertyDidChange } from '@glimmer/tracking';
import {
  clientBuilder,
  renderJitComponent,
  CustomJitRuntime,
} from '@glimmer/runtime';
import {
  Cursor as GlimmerCursor,
  RenderResult,
  Dict,
  Environment,
  TemplateIterator,
} from '@glimmer/interfaces';
import { JitContext } from '@glimmer/opcode-compiler';

import EnvironmentImpl from '../environment';
import { CompileTimeResolver, RuntimeResolver } from './resolvers';

import { RootReference, PathReference } from '@glimmer/reference';
import { ComponentFactory } from '../managers/component/custom';

import { SimpleElement } from '@simple-dom/interface';

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

  const { element, args } = options;

  const iterator = getTemplateIterator(ComponentClass, element, EnvironmentImpl.create(), args);
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

function dictToReference(dict?: Dict<unknown>): Dict<PathReference> {
  if (!dict) {
    return {};
  }

  return Object.keys(dict).reduce((acc, key) => {
    acc[key] = new RootReference(dict[key]);
    return acc;
  }, {} as Dict<PathReference>);
}

export function getTemplateIterator(
  ComponentClass: ComponentFactory,
  element: Element | SimpleElement,
  env: Environment,
  componentArgs?: Dict<unknown>
): TemplateIterator {
  const runtime = CustomJitRuntime(resolver, context, env);
  const builder = clientBuilder(runtime.env, {
    element,
    nextSibling: null,
  } as GlimmerCursor);

  const handle = resolver.registerRoot(ComponentClass);

  return renderJitComponent(runtime, builder, context, 0, handle, dictToReference(componentArgs));
}
