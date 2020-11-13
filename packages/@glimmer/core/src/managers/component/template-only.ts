import {
  InternalComponentManager,
  InternalComponentCapabilities,
  CapturedArguments,
  Environment,
  Template,
  TemplateOk,
  WithStaticLayout,
} from '@glimmer/interfaces';
import { createComputeRef, createConstRef, Reference } from '@glimmer/reference';
import { CONSTANT_TAG, Tag } from '@glimmer/validator';
import { unwrapTemplate } from '@glimmer/util';
import { DEBUG } from '@glimmer/env';

export const CAPABILITIES: InternalComponentCapabilities = {
  attributeHook: false,
  createArgs: false,
  createCaller: false,
  createInstance: true,
  dynamicLayout: false,
  dynamicScope: false,
  dynamicTag: false,
  elementHook: false,
  prepareArgs: false,
  updateHook: false,
  wrapped: false,
  willDestroy: false,
};

export class ComponentStateBucket {
  public name: string;

  constructor(public args: CapturedArguments) {}
}

const EMPTY_SELF = createConstRef(null, 'this');

/**
 * For performance reasons, we want to avoid instantiating component buckets for
 * components that don't have an associated component class that we would need
 * instantiate and invoke lifecycle hooks on.
 *
 * In development mode, however, we need to track some state about the component
 * in order to produce more useful error messages. This
 * TemplateOnlyComponentDebugBucket is only created in development mode to hold
 * that state.
 */
export class TemplateOnlyComponentDebugBucket {
  constructor(public definition: TemplateOnlyComponentDefinition) {}
}

export default class TemplateOnlyComponentManager
  implements
    InternalComponentManager<
      TemplateOnlyComponentDebugBucket | null,
      TemplateOnlyComponentDefinitionState
    >,
    WithStaticLayout<
      TemplateOnlyComponentDebugBucket | null,
      TemplateOnlyComponentDefinitionState
    > {
  static create(): TemplateOnlyComponentManager {
    return new TemplateOnlyComponentManager();
  }

  getDebugName(state: TemplateOnlyComponentDefinitionState): string {
    return state.name;
  }

  getCapabilities(): InternalComponentCapabilities {
    return CAPABILITIES;
  }

  getStaticLayout({ definition }: TemplateOnlyComponentDefinitionState): Template {
    return definition.template;
  }

  create(
    _env: Environment,
    state: TemplateOnlyComponentDefinitionState
  ): TemplateOnlyComponentDebugBucket | void {
    // In development mode, save off state needed for error messages. This will
    // get stripped in production mode and no bucket will be instantiated.
    return DEBUG ? new TemplateOnlyComponentDebugBucket(state.definition) : undefined;
  }

  getSelf(bucket: TemplateOnlyComponentDebugBucket): Reference {
    // TODO: Make this error message better, https://github.com/glimmerjs/glimmer-vm/issues/1153
    return DEBUG
      ? createComputeRef(() => {
          throw new Error(
            `You attempted to access \`this\` on a template only component, ${bucket.definition.state.name}. Template only components do not have a \`this\` context, and can only access arguments`
          );
        })
      : EMPTY_SELF;
  }

  getTag(): Tag {
    return CONSTANT_TAG;
  }

  didRenderLayout(): void {} // eslint-disable-line @typescript-eslint/no-empty-function
  didCreate(): void {} // eslint-disable-line @typescript-eslint/no-empty-function
  didUpdateLayout(): void {} // eslint-disable-line @typescript-eslint/no-empty-function
  didUpdate(): void {} // eslint-disable-line @typescript-eslint/no-empty-function
  getDestroyable(): null {
    return null;
  }
}

export interface TemplateOnlyComponentDefinitionState {
  name: string;
  definition: TemplateOnlyComponentDefinition;
}

export const TEMPLATE_ONLY_MANAGER = new TemplateOnlyComponentManager();

export class TemplateOnlyComponentDefinition {
  public state: TemplateOnlyComponentDefinitionState;
  public manager = TEMPLATE_ONLY_MANAGER;
  public template: TemplateOk;
  public handle: number;

  constructor(handle: number, name: string, template: Template) {
    this.handle = handle;
    this.template = unwrapTemplate(template);

    this.state = {
      name,
      definition: this,
    };
  }
}

export class TemplateOnlyComponent {}

// TODO: We end up creating an extra object here mainly to be the weakmap key
// for setComponentTemplate. It might be possible to optimize.
export function templateOnlyComponent(): TemplateOnlyComponent {
  return new TemplateOnlyComponent();
}
