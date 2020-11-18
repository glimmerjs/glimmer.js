export {
  default as renderComponent,
  RenderComponentOptions,
  didRender,
  getTemplateIterator,
} from './src/render-component';

export { BaseEnvDelegate } from './src/environment/delegates';

export type {
  ModifierManager,
  ModifierCapabilities,
  ComponentManager,
  ComponentCapabilities,
} from '@glimmer/interfaces';

export { setComponentManager, setModifierManager } from '@glimmer/runtime';
export { setHelperManager } from './src/managers';

export { TemplateArgs } from './src/interfaces';

export { ModifierDefinition, capabilities as modifierCapabilities } from './src/managers/modifier';

export {
  HelperManager,
  HelperDefinition,
  capabilities as helperCapabilities,
  Capabilities as HelperCapabilities,
} from './src/managers/helper';

export {
  ComponentDefinition,
  capabilities as componentCapabilities,
} from './src/managers/component/custom';

export { templateOnlyComponent } from './src/managers/component/template-only';

export { createTemplate, setComponentTemplate } from './src/template';

export { getOwner, setOwner } from './src/owner';
