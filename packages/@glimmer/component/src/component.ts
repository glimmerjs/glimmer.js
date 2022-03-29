import { setComponentManager, setOwner } from '@glimmer/core';
import GlimmerComponentManager from './component-manager';
import _GlimmerComponent, { Args } from '../addon/-private/component';
import { DEBUG } from '@glimmer/env';

export default class GlimmerComponent<S = unknown> extends _GlimmerComponent<S> {
  constructor(owner: object, args: Args<S>) {
    super(owner, args);

    if (DEBUG && !(owner !== null && typeof owner === 'object')) {
      throw new Error(
        `You must pass both the owner and args to super() in your component: ${this.constructor.name}. You can pass them directly, or use ...arguments to pass all arguments through.`
      );
    }

    setOwner(this, owner);
  }
}

setComponentManager((owner: {}) => {
  return new GlimmerComponentManager(owner);
}, GlimmerComponent);
