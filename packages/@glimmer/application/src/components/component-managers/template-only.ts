import { Owner } from '@glimmer/di';
import { Tag } from '@glimmer/reference';
import {
  ComponentManager as VMComponentManager,
  RuntimeResolver,
  ComponentCapabilities,
  CapturedArguments,
  Option,
  Invocation,
  Environment,
  WithAotStaticLayout,
  JitRuntimeResolver,
  AotRuntimeResolver,
  CompilableProgram,
  Template,
  WithJitStaticLayout,
  ProgramSymbolTable,
} from '@glimmer/interfaces';
import { PathReference, CONSTANT_TAG } from '@glimmer/reference';
import { DEBUG } from '@glimmer/env';

import { RootReference, TemplateOnlyComponentDebugReference } from '../../references';
import {
  ComponentDefinitionState,
  AotComponentDefinition,
  JitComponentDefinition,
} from '../component-definition';

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

const EMPTY_SELF = new RootReference(null);

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

export interface ExtendedTemplateMeta {
  specifier: string;
  managerId?: string;
}

export interface CompilableRuntimeResolver extends RuntimeResolver<ExtendedTemplateMeta> {
  compileTemplate(name: string, layout: Option<number>): Invocation;
}

export interface EnvironmentWithOwner extends Environment {
  getOwner(): Owner;
  setOwner(obj: Object, owner: Owner): void;
}

export default class TemplateOnlyComponentManager
  implements
    VMComponentManager<TemplateOnlyComponentDebugBucket | null, ComponentDefinitionState>,
    WithJitStaticLayout<
      TemplateOnlyComponentDebugBucket | null,
      TemplateOnlyComponentDefinitionState,
      JitRuntimeResolver
    >,
    WithAotStaticLayout<
      TemplateOnlyComponentDebugBucket | null,
      TemplateOnlyComponentDefinitionState,
      AotRuntimeResolver
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

  getAotStaticLayout({ definition }: TemplateOnlyComponentDefinitionState): Invocation {
    const { handle, symbolTable } = definition;
    return {
      handle,
      symbolTable
    };
  }

  create(
    _env: Environment,
    state: TemplateOnlyComponentDefinitionState
  ): TemplateOnlyComponentDebugBucket | void {
    // In development mode, save off state needed for error messages. This will
    // get stripped in production mode and no bucket will be instantiated.
    return DEBUG ? new TemplateOnlyComponentDebugBucket(state.definition) : null;
  }

  getSelf(bucket: TemplateOnlyComponentDebugBucket): PathReference {
    return DEBUG ? new TemplateOnlyComponentDebugReference(bucket.definition.state.name) : EMPTY_SELF;
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

export class TemplateOnlyComponentDefinition
  implements AotComponentDefinition, JitComponentDefinition {
  public state: TemplateOnlyComponentDefinitionState;
  public manager = TEMPLATE_ONLY_MANAGER;
  public handle: number;
  public symbolTable: ProgramSymbolTable;
  public template: Template;

  constructor(name: string, templateOrHandle: Template | number, symbolTable?: ProgramSymbolTable) {
    if (typeof templateOrHandle === 'number') {
      this.handle = templateOrHandle;
      this.symbolTable = symbolTable;
    } else {
      this.template = templateOrHandle;
    }

    this.state = {
      name,
      definition: this,
    };
  }
}
