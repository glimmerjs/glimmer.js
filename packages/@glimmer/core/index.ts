export {
  default as renderComponent,
  RenderComponentOptions,
  didRender,
  dictToReference,
} from './src/render-component';

export { RuntimeResolver, CompileTimeResolver } from './src/render-component/resolvers';

export {
  setComponentManager,
  setModifierManager,
} from './src/managers';

export { capabilities, Capabilities } from './src/managers/component/custom';

export { setComponentTemplate } from './src/template';
