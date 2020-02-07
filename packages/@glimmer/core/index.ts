export {
  default as renderComponent,
  RenderComponentOptions,
  didRender,
  getTemplateIterator,
} from './src/render-component';

export { iterableFor } from './src/environment/iterable';

export { setComponentManager, setModifierManager } from './src/managers';

export {
  ComponentManager,
  ComponentFactory,
  capabilities as componentCapabilities,
  Capabilities as ComponentCapabilities,
} from './src/managers/component/custom';

export { templateOnlyComponent } from './src/managers/component/template-only';

export { createTemplate, setComponentTemplate } from './src/template';

export { HOST_META_KEY, setHostMeta, getHostMeta } from './src/host-meta';

export * from './src/references';
