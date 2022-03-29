import { DEBUG } from '@glimmer/env';
import ApplicationInstance from '@ember/application/instance';

// Hax because Ember does not have types for `setComponentManager`
declare module '@ember/component' {
  export function setComponentManager<T extends object>(
    factory: (owner: ApplicationInstance) => GlimmerComponentManager,
    componentClass: T
  ): T;
}

import { setComponentManager } from '@ember/component';

import GlimmerComponentManager from './-private/ember-component-manager';
import _GlimmerComponent, { Args } from './-private/component';
import { setOwner } from '@ember/application';

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

setComponentManager((owner: ApplicationInstance) => {
  return new GlimmerComponentManager(owner);
}, GlimmerComponent);
