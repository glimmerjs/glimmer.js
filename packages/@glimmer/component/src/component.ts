import { setComponentManager } from '@glimmer/core';
import GlimmerComponentManager from './component-manager';
import GlimmerComponent from '../addon/-private/component';

export default GlimmerComponent;

setComponentManager((owner: {}) => {
  return new GlimmerComponentManager(owner);
}, GlimmerComponent);
