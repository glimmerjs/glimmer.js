export {
  default as renderComponent,
  RenderComponentOptions,
  didRender,
  getTemplateIterator,
} from './src/render-component';

export { iterableFor } from './src/environment/iterable';

export { setComponentManager, setModifierManager } from './src/managers';

export {
  capabilities,
  Capabilities,
  ComponentManager,
  ComponentFactory,
} from './src/managers/component/custom';

export { setComponentTemplate } from './src/template';

export { PUBLIC_DYNAMIC_SCOPE_KEY } from './src/scope';

export * from './src/references';
