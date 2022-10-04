import renderComponent, { didRender, getTemplateIterator } from './src/render-component';

import { BaseEnvDelegate } from './src/environment/delegates';

export type { ComponentDefinition } from './src/render-component';
export type {
  ModifierManager,
  ModifierCapabilities,
  ComponentManager,
  ComponentCapabilities,
  HelperManager,
} from '@glimmer/interfaces';

import { templateFactory as createTemplateFactory } from '@glimmer/opcode-compiler';
import { templateOnlyComponent } from '@glimmer/runtime';

import {
  setComponentManager,
  setModifierManager,
  setHelperManager,
  componentCapabilities,
  modifierCapabilities,
  helperCapabilities,
  setComponentTemplate,
} from '@glimmer/manager';

import { getOwner, setOwner } from '@glimmer/owner';
import { precompileTemplate } from './src/template';

export {
  renderComponent,
  didRender,
  getTemplateIterator,
  BaseEnvDelegate,
  createTemplateFactory,
  templateOnlyComponent,
  setComponentManager,
  setModifierManager,
  setHelperManager,
  componentCapabilities,
  modifierCapabilities,
  helperCapabilities,
  setComponentTemplate,
  getOwner,
  setOwner,
  precompileTemplate,
};
export default {
  renderComponent,
  didRender,
  getTemplateIterator,
  BaseEnvDelegate,
  createTemplateFactory,
  templateOnlyComponent,
  setComponentManager,
  setModifierManager,
  setHelperManager,
  componentCapabilities,
  modifierCapabilities,
  helperCapabilities,
  setComponentTemplate,
  getOwner,
  setOwner,
  precompileTemplate,
};
