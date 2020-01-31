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

    setOwner(this, owner);
  }
}
