import { DEBUG } from '@glimmer/env';
import type ApplicationInstance from '@ember/application/instance';
import { setComponentManager } from '@ember/component';
import { gte } from 'ember-compatibility-helpers';

// Hax because the old version of `@types/ember__component` the `1.x` branch
// uses does not provide any types for `setComponentManager` *and* because we
// are using a very old version of `setComponentManager` for versions before
// Ember 3.8.
declare module '@ember/component' {
  // The modern version.
  export function setComponentManager<T extends object>(
    factory: (owner: ApplicationInstance) => GlimmerComponentManager,
    componentClass: T
  ): T;

  // The pre-3.8 version.
  export function setComponentManager<T extends object>(name: string, componentClass: T): T;
}

import GlimmerComponentManager from './-private/ember-component-manager';
import GlimmerComponentBase, { Args } from './-private/component';

let GlimmerComponent = GlimmerComponentBase;

if (DEBUG) {
  // Add assertions against using Glimmer.js only APIs

  // TODO: Add GlimmerComponent API docs link to these messages once API docs are live
  function throwMethodUseError(methodName: string) {
    throw new Error(
      `You attempted to define the '${methodName}' method on a Glimmer Component, but that lifecycle hook does not exist in Ember.js applications, it only exists in Glimmer.js apps. You can rename this method, and you can trigger it using a modifier such as {{did-insert}} from '@ember/render-modifiers': https://github.com/emberjs/ember-render-modifiers.`
    );
  }

  function throwPropertyUseError(propertyName: string) {
    throw new Error(
      `You attempted to access the '${propertyName}' property on a Glimmer Component, but that property does not exist in Ember.js applications, it only exists in Glimmer.js apps. You define a class field with the same name on your component class and it will overwrite this error message, but it will not be used by the framework.`
    );
  }

  GlimmerComponent = class GlimmerDebugComponent<S = unknown> extends GlimmerComponent<S> {
    constructor(owner: unknown, args: Args<S>) {
      super(owner, args);

      if (typeof this['didInsertElement'] === 'function') {
        throwMethodUseError('didInsertElement');
      }

      if (typeof this['didUpdate'] === 'function') {
        throwMethodUseError('didUpdate');
      }
    }
  };

  let proto = GlimmerComponent.prototype;

  function defineErrorProp(
    proto: GlimmerComponentBase,
    key: string,
    getterMethod: (key: string) => unknown
  ) {
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
