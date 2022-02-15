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

export { templateFactory as createTemplateFactory } from '@glimmer/opcode-compiler';
export { templateOnlyComponent } from '@glimmer/runtime';

export {
  setComponentManager,
  setModifierManager,
  setHelperManager,
  componentCapabilities,
  modifierCapabilities,
  helperCapabilities,
  setComponentTemplate,
} from '@glimmer/manager';

export { getOwner, setOwner } from '@glimmer/owner';

export { precompileTemplate } from './src/template';
