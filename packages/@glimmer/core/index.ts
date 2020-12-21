export {
  default as renderComponent,
  RenderComponentOptions,
  didRender,
  getTemplateIterator,
  ComponentDefinition,
} from './src/render-component';

export { BaseEnvDelegate } from './src/environment/delegates';

export type {
  ModifierManager,
  ModifierCapabilities,
  ComponentManager,
  ComponentCapabilities,
  HelperManager,
} from '@glimmer/interfaces';

export { templateOnlyComponent } from '@glimmer/runtime';

export { TemplateArgs } from './src/interfaces';

export {
  setComponentManager,
  setModifierManager,
  modifierCapabilities,
  setHelperManager,
  componentCapabilities,
  helperCapabilities,
} from '@glimmer/manager';

export { getOwner, setOwner } from '@glimmer/owner';

export { createTemplate, setComponentTemplate } from './src/template';
