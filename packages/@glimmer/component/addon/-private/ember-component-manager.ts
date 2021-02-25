import { DEBUG } from '@glimmer/env';
import Ember from 'ember';
import { set } from '@ember/object';
import { getOwner, setOwner } from '@ember/application';
import { capabilities } from '@ember/component';
import { schedule } from '@ember/runloop';
import { gte } from 'ember-compatibility-helpers';
import BaseComponentManager, {
  ComponentManagerArgs,
  CustomComponentCapabilities,
} from './base-component-manager';

import GlimmerComponent, { Constructor } from './component';
import * as destroyables from './destroyables';
const { setDestroyed, setDestroying } = destroyables;

const CAPABILITIES = gte('3.13.0-beta.1')
  ? capabilities('3.13', {
      destructor: true,
      asyncLifecycleCallbacks: false,
      updateHook: false,
    })
  : capabilities('3.4', {
      destructor: true,
      asyncLifecycleCallbacks: false,
    });

const scheduledDestroyComponent = gte('3.20.0-beta.4')
  ? undefined
  : (component: GlimmerComponent, meta: EmberMeta) => {
    if (component.isDestroyed) {
      return;
    }

    Ember.destroy(component);

    meta.setSourceDestroyed();
    setDestroyed(component);
  };

const destroy = gte('3.20.0-beta.4')
  ? Ember.destroy
  : (component:  GlimmerComponent) => {
    if (component.isDestroying) {
      return;
    }

    let meta = Ember.meta(component);

    meta.setSourceDestroying();
    setDestroying(component);

    schedule('actions', component, component.willDestroy);
    schedule('destroy', this, scheduledDestroyComponent, component, meta);
  };


const registerDestructor = gte('3.22.0-beta')
  // @ts-ignore
  ? Ember._registerDestructor
  : gte('3.20.0-beta.4')
  // @ts-ignore
  ? Ember.__loader.require('@glimmer/runtime').registerDestructor
  : undefined;

/**
 * This component manager runs in Ember.js environments and extends the base component manager to:
 *
 * 1. Properly destroy the component's associated `meta` data structure
 * 2. Schedule destruction using Ember's runloop
 */
class EmberGlimmerComponentManager extends BaseComponentManager(setOwner, getOwner, CAPABILITIES) {
  createComponent(
    ComponentClass: Constructor<GlimmerComponent>,
    args: ComponentManagerArgs
  ): GlimmerComponent {
    const component = super.createComponent(ComponentClass, args);
    if (gte('3.20.0-beta.4')) {
      registerDestructor(component, () => {
        component.willDestroy();
      });
    }

    return component;
  }

  destroyComponent(component: GlimmerComponent) {
    destroy(component);
  }
}

interface EmberGlimmerComponentManager {
  updateComponent?: (component: GlimmerComponent, args: ComponentManagerArgs) => void;
}

// In Ember 3.12 and earlier, the updateComponent hook was mandatory.
// As of Ember 3.13, the `args` object is stable and each property of the
// object participates in the autotrack stack on its own. This means we do not
// need to set the `args` property on the component instance to invalidate
// tracked getters that rely on `args`, and therefore don't require the `updateComponent`
// hook at all.
if (!gte('3.13.0-beta.1')) {
  EmberGlimmerComponentManager.prototype.updateComponent = function updateComponent(
    component: GlimmerComponent,
    args: ComponentManagerArgs
  ) {
    let argSnapshot = args.named;

    if (DEBUG) {
      argSnapshot = Object.freeze(argSnapshot);
    }

    set(component, 'args', argSnapshot);
  };
}

export default EmberGlimmerComponentManager;

interface EmberMeta {
  setSourceDestroying(): void;
  setSourceDestroyed(): void;
}

declare module 'ember' {

  export namespace Ember {
    function destroy(obj: {}): void;
    function meta(obj: {}): EmberMeta;
  }
}

declare module '@ember/component' {
  export function capabilities(
    version: '3.13' | '3.4',
    capabilities: Partial<CustomComponentCapabilities>
  ): CustomComponentCapabilities;
}
