export {
  default as renderComponent,
  RenderComponentOptions,
  didRender,
  getTemplateIterator,
} from './src/render-component';

export { iterableFor } from './src/environment/iterable';

export { setComponentManager, setModifierManager } from './src/managers';

export {
  Args as CapturedArgs,
  ComponentManager,
  ComponentFactory,
  capabilities as componentCapabilities,
  Capabilities as ComponentCapabilities,
} from './src/managers/component/custom';

export { templateOnlyComponent } from './src/managers/component/template-only';

export { createTemplate, setComponentTemplate } from './src/template';

export * from './src/references';
