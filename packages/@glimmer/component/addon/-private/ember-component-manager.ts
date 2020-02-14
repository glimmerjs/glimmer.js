import { DEBUG } from '@glimmer/env';
import Ember from 'ember';
import { set } from '@ember/object';
import { capabilities } from '@ember/component';
import { schedule } from '@ember/runloop';
import { gte } from 'ember-compatibility-helpers';
import BaseComponentManager from './base-component-manager';

import GlimmerComponent, { setDestroyed, setDestroying } from './component';
import { ComponentCapabilities, CapturedArgs } from '@glimmer/core';

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

function scheduledDestroyComponent(component: GlimmerComponent, meta: EmberMeta): void {
  if (component.isDestroyed) {
    return;
  }

  Ember.destroy(component);

  meta.setSourceDestroyed();
  setDestroyed(component);
}

/**
 * This component manager runs in Ember.js environments and extends the base component manager to:
 *
 * 1. Properly destroy the component's associated `meta` data structure
 * 2. Schedule destruction using Ember's runloop
 */
class EmberGlimmerComponentManager extends BaseComponentManager<GlimmerComponent> {
  capabilities = CAPABILITIES;

  destroyComponent(component: GlimmerComponent): void {
    if (component.isDestroying) {
      return;
    }

    const meta = Ember.meta(component);

    meta.setSourceDestroying();
    setDestroying(component);

    schedule('actions', component, component.willDestroy);
    schedule('destroy', this, scheduledDestroyComponent, component, meta);
  }
}


interface EmberGlimmerComponentManager {
  updateComponent?: (component: GlimmerComponent, args: CapturedArgs) => void;
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
    args: CapturedArgs
  ): void {
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
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Ember {
    function destroy(obj: {}): void;
    function meta(obj: {}): EmberMeta;
  }
}

declare module '@ember/component' {
  export function capabilities(
    version: '3.13' | '3.4',
    capabilities: Partial<ComponentCapabilities>
  ): ComponentCapabilities;
}
