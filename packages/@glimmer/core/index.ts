export {
  default as renderComponent,
  RenderComponentOptions,
  didRender,
  getTemplateIterator,
} from './src/render-component';

export { iterableFor } from './src/environment/iterable';

export { setComponentManager, setModifierManager } from './src/managers';

export { ComponentManager, ComponentFactory } from './src/managers/component/custom';

export { capabilities, Capabilities } from './src/managers/component/capabilities';

export { templateOnlyComponent } from './src/managers/component/template-only';

export { createTemplate, setComponentTemplate } from './src/template';

export { PUBLIC_DYNAMIC_SCOPE_KEY, getScope } from './src/scope';

export * from './src/references';
