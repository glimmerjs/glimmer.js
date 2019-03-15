import ApplicationInstance from '@ember/application/instance';
import { setComponentManager } from '@ember/component';
import { get, set } from '@ember/object';
import { gte } from 'ember-compatibility-helpers';

import GlimmerComponentManager from './-private/component-manager';
import _GlimmerComponent from './-private/component';

class GlimmerComponent<T> extends _GlimmerComponent<T> {
  get args() {
    return get(this as any, '__args__');
  }

  set args(args) {
    set(this as any, '__args__', args);
  }
}

if (gte('3.8.0-beta.1')) {
  setComponentManager((owner: ApplicationInstance) => {
    return new GlimmerComponentManager(owner);
  }, GlimmerComponent);
} else {
  setComponentManager('glimmer', GlimmerComponent);
}

export default GlimmerComponent;
