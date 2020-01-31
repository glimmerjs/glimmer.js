import { ComponentDefinition, Helper as GlimmerHelper, ModifierManager, Template } from '@glimmer/interfaces';
import { templateFactory } from '@glimmer/opcode-compiler';

import { getComponentManager } from '../managers';
import { CustomComponentDefinition, TemplateMeta, CUSTOM_COMPONENT_MANAGER } from '../managers/component/custom';
import { getComponentTemplate } from '../template';
import { ComponentFactory } from '../managers/component/custom';

// Create a global context that we use as the "owner" for our managers
const CONTEXT = {};

export interface ComponentDefinitionWithMeta extends ComponentDefinition {
  meta: {
    handle: number,
    template: Template<TemplateMeta>
  }
}

interface HelperDefinition {
  state: {
    fn: GlimmerHelper;
    handle: number;
  };
}

export interface Modifier {
  state: any;
  manager: ModifierManager;
}

const COMPONENT_DEFINITIONS = new WeakMap<ComponentFactory, ComponentDefinitionWithMeta>();
const HELPER_DEFINITIONS = new WeakMap<GlimmerHelper, HelperDefinition>();
const MODIFIER_HANDLES = new WeakMap<Modifier, number>();

export function definitionForComponent(
  ComponentClass: ComponentFactory
): ComponentDefinitionWithMeta {
  return COMPONENT_DEFINITIONS.get(ComponentClass) || createComponentDefinition(ComponentClass);
}

export function definitionForHelper(Helper: GlimmerHelper): HelperDefinition {
  return HELPER_DEFINITIONS.get(Helper) || createHelperDefinition(Helper);
}

let HANDLE = 0;

export function handleForModifier(modifier: Modifier) {
  let handle = MODIFIER_HANDLES.get(modifier);

  if (!handle) {
    handle = HANDLE++;
    MODIFIER_HANDLES.set(modifier, handle);
  }

  return handle;
}

function createComponentDefinition(ComponentClass: ComponentFactory): ComponentDefinitionWithMeta {
  const delegate = getComponentManager(CONTEXT, ComponentClass)!;
  const serializedTemplate = getComponentTemplate(ComponentClass);

  let template = templateFactory<TemplateMeta>(serializedTemplate!).create();

  const definition = {
    state: new CustomComponentDefinition(
      'component',
      { class: ComponentClass },
      delegate,
      template,
    ).state,
    manager: CUSTOM_COMPONENT_MANAGER,
    meta: {
      handle: HANDLE++,
      template,
    }
  };

  COMPONENT_DEFINITIONS.set(ComponentClass, definition);

  return definition;
}

function createHelperDefinition(Helper: GlimmerHelper): HelperDefinition {
  const definition = {
    state: {
      fn: Helper,
      handle: HANDLE++,
    },
  };

  HELPER_DEFINITIONS.set(Helper, definition);
  return definition;
}
