import {
  ComponentDefinition,
  Helper as GlimmerHelper,
  ModifierManager,
  TemplateOk,
} from '@glimmer/interfaces';
import { templateFactory } from '@glimmer/opcode-compiler';

import { getComponentTemplate } from '../template';
import { getComponentManager } from '../managers';
import {
  ComponentFactory,
  CustomComponentDefinition,
  TemplateMeta,
} from '../managers/component/custom';
import {
  TemplateOnlyComponentDefinition,
  TemplateOnlyComponent,
} from '../managers/component/template-only';

// Create a global context that we use as the "owner" for our managers
const CONTEXT = {};

export interface ComponentDefinitionWithHandle extends ComponentDefinition {
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

const COMPONENT_DEFINITIONS = new WeakMap<ComponentFactory, ComponentDefinitionWithHandle>();
const HELPER_DEFINITIONS = new WeakMap<GlimmerHelper, HelperDefinition>();
const MODIFIER_HANDLES = new WeakMap<Modifier, number>();

export function definitionForComponent(
  ComponentClass: ComponentFactory
): ComponentDefinitionWithHandle {
  return COMPONENT_DEFINITIONS.get(ComponentClass) || createComponentDefinition(ComponentClass);
}

export function definitionForHelper(Helper: GlimmerHelper): HelperDefinition {
  return HELPER_DEFINITIONS.get(Helper) || createHelperDefinition(Helper);
}

let HANDLE = 0;

export function handleForModifier(modifier: Modifier): number {
  let handle = MODIFIER_HANDLES.get(modifier);

  if (!handle) {
    handle = HANDLE++;
    MODIFIER_HANDLES.set(modifier, handle);
  }

  return handle;
}

///////////

function createComponentDefinition(
  ComponentClass: ComponentFactory | TemplateOnlyComponent
): ComponentDefinitionWithHandle {
  const serializedTemplate = getComponentTemplate(ComponentClass);
  const template = templateFactory<TemplateMeta>(serializedTemplate!).create();

  let definition, delegate;

  if (ComponentClass instanceof TemplateOnlyComponent) {
    // TODO: We probably need a better way to get a name for the template,
    // currently it'll just be `template-only-component` which is not great
    // for debugging
    definition = new TemplateOnlyComponentDefinition(HANDLE++, 'template-only-component', template);
  } else {
    delegate = getComponentManager(CONTEXT, ComponentClass)!;

    definition = new CustomComponentDefinition(HANDLE++, ComponentClass, delegate, template);
  }

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
