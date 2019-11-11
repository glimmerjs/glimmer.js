import { DEBUG } from '@glimmer/env';
import ApplicationInstance from '@ember/application/instance';
import { setComponentManager } from '@ember/component';
import { gte } from 'ember-compatibility-helpers';

import GlimmerComponentManager from './-private/ember-component-manager';
import GlimmerComponentBase from './-private/component';

let GlimmerComponent = GlimmerComponentBase;

if (DEBUG) {
  // Add assertions against using Glimmer.js only APIs

  // TODO: Add GlimmerComponent API docs link to these messages once API docs are live
  function throwMethodUseError(methodName: string) {
    throw new Error(`You attempted to define the '${methodName}' method on a Glimmer Component, but that lifecycle hook does not exist in Ember.js applications, it only exists in Glimmer.js apps. You can rename this method, and you can trigger it using a modifier such as {{did-insert}} from '@ember/render-modifiers': https://github.com/emberjs/ember-render-modifiers.`);
  }

  function throwPropertyUseError(propertyName: string) {
    throw new Error(`You attempted to access the '${propertyName}' property on a Glimmer Component, but that property does not exist in Ember.js applications, it only exists in Glimmer.js apps. You define a class field with the same name on your component class and it will overwrite this error message, but it will not be used by the framework.`);
  }

  GlimmerComponent = class GlimmerDebugComponent<T> extends GlimmerComponent<T> {
    constructor(owner: unknown, args: T) {
      super(owner, args);

      if (typeof this['didInsertElement'] === 'function') {
        throwMethodUseError('didInsertElement');
      }

      if (typeof this['didUpdate'] === 'function') {
        throwMethodUseError('didUpdate');
      }
    }
  };

  let proto = GlimmerComponent.prototype as any;

  function defineErrorProp(proto, key, getterMethod) {
    Object.defineProperty(proto, key, {
      get: () => getterMethod(key),
      set(value) {
        Object.defineProperty(this, key, { value });
      },
    });
  }

  // Methods should still throw whenever they are accessed
  defineErrorProp(proto, 'bounds', throwPropertyUseError);
  defineErrorProp(proto, 'element', throwPropertyUseError);
  defineErrorProp(proto, 'debugName', throwPropertyUseError);
}

if (gte('3.8.0-beta.1')) {
  setComponentManager((owner: ApplicationInstance) => {
    return new GlimmerComponentManager(owner);
  }, GlimmerComponent);
} else {
  setComponentManager('glimmer', GlimmerComponent);
}

export default GlimmerComponent;
