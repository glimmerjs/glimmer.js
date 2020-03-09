import {
  ComponentDefinition as VMComponentDefinition,
  Helper as GlimmerHelper,
  ModifierManager,
  TemplateOk,
} from '@glimmer/interfaces';
import { templateFactory } from '@glimmer/opcode-compiler';

import { getComponentTemplate, TemplateMeta } from '../template';
import { VMCustomComponentDefinition, ComponentDefinition } from '../managers/component/custom';
import {
  TemplateOnlyComponentDefinition,
  TemplateOnlyComponent,
} from '../managers/component/template-only';

export interface ComponentDefinitionWithHandle extends VMComponentDefinition {
  handle: number;
  template: TemplateOk<TemplateMeta>;
}

interface HelperDefinition {
  state: {
    fn: GlimmerHelper;
    handle: number;
  };
}

export interface Modifier {
  state: unknown;
  manager: ModifierManager;
}

///////////

const VM_COMPONENT_DEFINITIONS = new WeakMap<ComponentDefinition, ComponentDefinitionWithHandle>();
const VM_HELPER_DEFINITIONS = new WeakMap<GlimmerHelper, HelperDefinition>();
const VM_MODIFIER_HANDLES = new WeakMap<Modifier, number>();

export function vmDefinitionForComponent(
  ComponentDefinition: ComponentDefinition
): ComponentDefinitionWithHandle {
  return VM_COMPONENT_DEFINITIONS.get(ComponentDefinition) || createVMComponentDefinition(ComponentDefinition);
}

export function vmDefinitionForHelper(Helper: GlimmerHelper): HelperDefinition {
  return VM_HELPER_DEFINITIONS.get(Helper) || createVMHelperDefinition(Helper);
}

let HANDLE = 0;

export function vmHandleForModifier(modifier: Modifier): number {
  let handle = VM_MODIFIER_HANDLES.get(modifier);

  if (!handle) {
    handle = HANDLE++;
    VM_MODIFIER_HANDLES.set(modifier, handle);
  }

  return handle;
}

///////////

function createVMComponentDefinition(
  ComponentDefinition: ComponentDefinition | TemplateOnlyComponent
): ComponentDefinitionWithHandle {
  const serializedTemplate = getComponentTemplate(ComponentDefinition);
  const template = templateFactory<TemplateMeta>(serializedTemplate!).create();

  let definition;

  if (ComponentDefinition instanceof TemplateOnlyComponent) {
    // TODO: We probably need a better way to get a name for the template,
    // currently it'll just be `template-only-component` which is not great
    // for debugging
    definition = new TemplateOnlyComponentDefinition(HANDLE++, 'template-only-component', template);
  } else {
    definition = new VMCustomComponentDefinition(HANDLE++, ComponentDefinition, template);
  }

  VM_COMPONENT_DEFINITIONS.set(ComponentDefinition, definition);

  return definition;
}

function createVMHelperDefinition(Helper: GlimmerHelper): HelperDefinition {
  const definition = {
    state: {
      fn: Helper,
      handle: HANDLE++,
    },
  };

  VM_HELPER_DEFINITIONS.set(Helper, definition);
  return definition;
}
