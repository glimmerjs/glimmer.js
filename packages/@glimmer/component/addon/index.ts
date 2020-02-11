import { DEBUG } from '@glimmer/env';
import ApplicationInstance from '@ember/application/instance';
import { setComponentManager } from '@ember/component';
import { gte } from 'ember-compatibility-helpers';

import GlimmerComponentManager from './-private/ember-component-manager';
import GlimmerComponent from './-private/component';
import { setOwner } from '@ember/application';

if (gte('3.8.0-beta.1')) {
  setComponentManager((owner: ApplicationInstance) => {
    return new GlimmerComponentManager(owner);
  }, GlimmerComponent);
} else {
  setComponentManager('glimmer', GlimmerComponent);
}

export default class extends GlimmerComponent {
  constructor(owner, args) {
    super(owner, args);

    if (DEBUG && !(owner !== null && typeof owner === 'object')) {
      throw new Error(
        `You must pass both the owner and args to super() in your component: ${this.constructor.name}. You can pass them directly, or use ...arguments to pass all arguments through.`
      );
    }

    setOwner(this, owner);
  }
}
