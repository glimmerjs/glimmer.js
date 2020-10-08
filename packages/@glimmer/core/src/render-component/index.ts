import {
  clientBuilder,
  renderComponent as glimmerRenderComponent,
  runtimeContext,
  EnvironmentDelegate,
  DynamicScopeImpl,
  renderSync,
  rehydrationBuilder,
} from '@glimmer/runtime';
import {
  Cursor as GlimmerCursor,
  RenderResult,
  Dict,
  TemplateIterator,
  EnvironmentOptions,
  WithStaticLayout,
  Environment,
  ElementBuilder,
} from '@glimmer/interfaces';
import { artifacts } from '@glimmer/program';
import { syntaxCompilationContext } from '@glimmer/opcode-compiler';

import { ClientEnvDelegate } from '../environment/delegates';
import { CompileTimeResolver, RuntimeResolver } from './resolvers';

import { createConstRef, childRefFor, Reference } from '@glimmer/reference';
import { ComponentDefinition } from '../managers/component/custom';

import { OWNER_KEY, DEFAULT_OWNER } from '../owner';
import { SimpleElement, SimpleDocument } from '@simple-dom/interface';

export interface RenderComponentOptions {
  element: Element;
  args?: Dict<unknown>;
  owner?: object;
  rehydrate?: boolean;
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

  const { env, iterator } = getTemplateIterator(
    ComponentClass,
    element,
    { document },
    new ClientEnvDelegate(),
    args,
    owner,
    options.rehydrate ? rehydrationBuilder : clientBuilder
  );
  const result = renderSync(env, iterator);
  results.push(result);
}

export default renderComponent;

const results: RenderResult[] = [];

let scheduled = false;
export function scheduleRevalidate(): void {
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
const sharedArtifacts = artifacts();
const context = syntaxCompilationContext(sharedArtifacts, new CompileTimeResolver(resolver));

function dictToReference(dict: Dict<unknown>): Dict<Reference> {
  const root = createConstRef(dict, 'args');

  return Object.keys(dict).reduce((acc, key) => {
    acc[key] = childRefFor(root, key);
    return acc;
  }, {} as Dict<Reference>);
}

export function getTemplateIterator(
  ComponentClass: ComponentDefinition,
  element: Element | SimpleElement,
  envOptions: EnvironmentOptions,
  envDelegate: EnvironmentDelegate,
  componentArgs: Dict<unknown> = {},
  owner = DEFAULT_OWNER,
  builderFactory: (env: Environment, cursor: GlimmerCursor) => ElementBuilder = clientBuilder
): { iterator: TemplateIterator; env: Environment } {
  const runtime = runtimeContext(envOptions, envDelegate, sharedArtifacts, resolver);
  const builder = builderFactory(runtime.env, {
    element,
    nextSibling: null,
  } as GlimmerCursor);

  const handle = resolver.registerRoot(ComponentClass);
  const definition = resolver.lookupComponent(handle)!;
  const compilable = (definition.manager as WithStaticLayout).getStaticLayout(
    definition.state,
    resolver
  );

  let dynamicScope;

  if (owner) {
    dynamicScope = new DynamicScopeImpl({
      [OWNER_KEY]: createConstRef(owner, 'owner'),
    });
  }

  return {
    iterator: glimmerRenderComponent(
      runtime,
      builder,
      context,
      definition,
      compilable,
      dictToReference(componentArgs),
      dynamicScope
    ),
    env: runtime.env,
  };
}
