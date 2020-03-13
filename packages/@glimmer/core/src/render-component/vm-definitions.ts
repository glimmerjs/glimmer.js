import {
  ComponentDefinition as VMComponentDefinition,
  Helper as VMHelperFactory,
  ModifierManager,
  TemplateOk,
} from '@glimmer/interfaces';
import { templateFactory } from '@glimmer/opcode-compiler';

import { getComponentTemplate, TemplateMeta } from '../template';
import { VMCustomComponentDefinition, ComponentDefinition } from '../managers/component/custom';
import { HelperDefinition, vmHelperFactoryFor } from '../managers/helper';
import {
  TemplateOnlyComponentDefinition,
  TemplateOnlyComponent,
} from '../managers/component/template-only';
import { DEBUG } from '@glimmer/env';

export interface VMComponentDefinitionWithHandle extends VMComponentDefinition {
  handle: number;
  template: TemplateOk<TemplateMeta>;
}

export interface VMHelperDefinition {
  helper: VMHelperFactory;
  handle: number;
}

export interface Modifier {
  state: unknown;
  manager: ModifierManager;
}

///////////

let HANDLE = 0;

const VM_COMPONENT_DEFINITIONS = new WeakMap<ComponentDefinition, VMComponentDefinitionWithHandle>();
const VM_HELPER_DEFINITIONS = new WeakMap<HelperDefinition, VMHelperDefinition>();
const VM_MODIFIER_HANDLES = new WeakMap<Modifier, number>();

export function vmDefinitionForComponent(
  ComponentDefinition: ComponentDefinition
): VMComponentDefinitionWithHandle {
  return VM_COMPONENT_DEFINITIONS.get(ComponentDefinition) || createVMComponentDefinition(ComponentDefinition);
}

export function vmDefinitionForHelper(Helper: HelperDefinition): VMHelperDefinition {
  return VM_HELPER_DEFINITIONS.get(Helper) || createVMHelperDefinition(Helper);
}

export function vmHandleForModifier(modifier: Modifier): number {
  let handle = VM_MODIFIER_HANDLES.get(modifier);

  if (!handle) {
    handle = HANDLE++;
    VM_MODIFIER_HANDLES.set(modifier, handle);
  }

  return handle;
}

///////////

let BUILT_INS: WeakSet<object> | undefined;

if (DEBUG) {
  BUILT_INS = new WeakSet();
}

function handleForBuiltIn(builtIn: object): number {
  if (DEBUG && BUILT_INS!.has(builtIn)) {
    throw new Error('attempted to register the same built-in twice');
  }

  return HANDLE++
}

export function vmDefinitionForBuiltInHelper(helper: VMHelperFactory): VMHelperDefinition {
  return {
    helper,
    handle: handleForBuiltIn(helper),
  };
}

///////////

function createVMComponentDefinition(
  ComponentDefinition: ComponentDefinition | TemplateOnlyComponent
): VMComponentDefinitionWithHandle {
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

function createVMHelperDefinition(userDefinition: HelperDefinition): VMHelperDefinition {
  const definition = {
    helper: vmHelperFactoryFor(userDefinition),
    handle: HANDLE++,
  };

  VM_HELPER_DEFINITIONS.set(userDefinition, definition);
  return definition;
}
