import {
  ComponentManager as VMComponentManager,
  RuntimeResolver,
  ComponentCapabilities,
  CapturedArguments,
  Option,
  Invocation,
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

import { RootReference } from '@glimmer/application';
import { unwrapTemplate } from '@glimmer/opcode-compiler';

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
};

export class ComponentStateBucket {
  public name: string;

  constructor(public args: CapturedArguments) {
  }
}

const EMPTY_SELF = new RootReference({});

let TemplateOnlyComponentDebugReference: undefined | {
  new(name: string): ConstReference;
};

if (DEBUG) {
  TemplateOnlyComponentDebugReference = class extends ConstReference<void> {
    constructor(protected name: string) {
      super(undefined);
    }

    get(propertyKey: string): PathReference<unknown> {
      throw new Error(
        `You tried to reference {{${propertyKey}}} from the ${
          this.name
        } template, which doesn't have an associated component class. Template-only components can only access args passed to them. Did you mean {{@${propertyKey}}}?`
      );
    }
  }
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
    VMComponentManager<TemplateOnlyComponentDebugBucket | null, TemplateOnlyComponentDefinitionState>,
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
    return DEBUG ? new TemplateOnlyComponentDebugReference!(bucket.definition.state.name) : EMPTY_SELF;
  }

  getTag(): Tag {
    return CONSTANT_TAG;
  }

  didRenderLayout() {}
  didCreate() {}
  didUpdateLayout() {}
  didUpdate() {}
  getDestructor() {
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

  constructor(name: string, template: Template) {
    this.template = unwrapTemplate(template);

    this.state = {
      name,
      definition: this,
    };
  }
}
