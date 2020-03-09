import {
  ComponentManager as VMComponentManager,
  ComponentCapabilities,
  CapturedArguments,
  Environment,
  JitRuntimeResolver,
  CompilableProgram,
  Template,
  TemplateOk,
  WithJitStaticLayout,
} from '@glimmer/interfaces';
import { PathReference, ConstReference } from '@glimmer/reference';
import { CONSTANT_TAG, Tag } from '@glimmer/validator';
import { DEBUG } from '@glimmer/env';

import { unwrapTemplate } from '@glimmer/opcode-compiler';
import { TemplateMeta } from '../../template';

export const CAPABILITIES: ComponentCapabilities = {
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

const EMPTY_SELF = new ConstReference(null);

let TemplateOnlyComponentDebugReference:
  | undefined
  | {
      new (name: string): ConstReference;
    };

if (DEBUG) {
  TemplateOnlyComponentDebugReference = class extends ConstReference<void> {
    constructor(protected name: string) {
      super(undefined);
    }

    get(propertyKey: string): PathReference<unknown> {
      throw new Error(
        `You tried to reference {{${propertyKey}}} from the ${this.name} template, which doesn't have an associated component class. Template-only components can only access args passed to them. Did you mean {{@${propertyKey}}}?`
      );
    }
  };
}

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
    VMComponentManager<
      TemplateOnlyComponentDebugBucket | null,
      TemplateOnlyComponentDefinitionState
    >,
    WithJitStaticLayout<
      TemplateOnlyComponentDebugBucket | null,
      TemplateOnlyComponentDefinitionState,
      JitRuntimeResolver
    > {
  static create(): TemplateOnlyComponentManager {
    return new TemplateOnlyComponentManager();
  }

  getCapabilities(): ComponentCapabilities {
    return CAPABILITIES;
  }

  getJitStaticLayout({ definition }: TemplateOnlyComponentDefinitionState): CompilableProgram {
    return definition.template.asLayout();
  }

  create(
    _env: Environment,
    state: TemplateOnlyComponentDefinitionState
  ): TemplateOnlyComponentDebugBucket | void {
    // In development mode, save off state needed for error messages. This will
    // get stripped in production mode and no bucket will be instantiated.
    return DEBUG ? new TemplateOnlyComponentDebugBucket(state.definition) : undefined;
  }

  getSelf(bucket: TemplateOnlyComponentDebugBucket): PathReference {
    return DEBUG
      ? new TemplateOnlyComponentDebugReference!(bucket.definition.state.name)
      : EMPTY_SELF;
  }

  getTag(): Tag {
    return CONSTANT_TAG;
  }

  didRenderLayout(): void {} // eslint-disable-line @typescript-eslint/no-empty-function
  didCreate(): void {} // eslint-disable-line @typescript-eslint/no-empty-function
  didUpdateLayout(): void {} // eslint-disable-line @typescript-eslint/no-empty-function
  didUpdate(): void {} // eslint-disable-line @typescript-eslint/no-empty-function
  getDestructor(): null {
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
  public template: TemplateOk<TemplateMeta>;
  public handle: number;

  constructor(handle: number, name: string, template: Template<TemplateMeta>) {
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
