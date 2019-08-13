import { DEBUG } from '@glimmer/env';
import Ember from 'ember';
import { set } from '@ember/object';
import { getOwner, setOwner } from '@ember/application';
import ApplicationInstance from '@ember/application/instance';
import { capabilities } from '@ember/component';
import { schedule } from '@ember/runloop';
import { gte } from 'ember-compatibility-helpers';

import GlimmerComponent, { DESTROYING, DESTROYED, ARGS_SET } from './component';

export interface ComponentManagerArgs {
  named: object;
  positional: any[];
}
type CreateComponentResult = GlimmerComponent<object> & {
  ___createComponentResult: true;
};

export default class GlimmerComponentManager {
  static create(attrs: any) {
    let owner = getOwner(attrs);
    return new this(owner);
  }
  capabilities: any;
  constructor(owner: ApplicationInstance) {
    setOwner(this, owner);
    if (gte('3.13.0-beta.1')) {
      this.capabilities = capabilities('3.13', {
        destructor: true,
        asyncLifecycleCallbacks: true,
        updateHook: false,
      });
    } else {
      this.capabilities = capabilities('3.4', {
        destructor: true,
        asyncLifecycleCallbacks: true,
      });
    }
  }

  createComponent(
    Klass: typeof GlimmerComponent,
    args: ComponentManagerArgs
  ): CreateComponentResult {
    if (DEBUG) {
      ARGS_SET.add(args.named);
    }

    return new Klass(getOwner(this), args.named) as CreateComponentResult;
  }

  destroyComponent(component: CreateComponentResult) {
    if (component.isDestroying) {
      return;
    }

    let meta = Ember.meta(component);

    meta.setSourceDestroying();
    component[DESTROYING] = true;

    schedule('actions', component, component.willDestroy);
    schedule('destroy', this, this.scheduledDestroyComponent, component, meta);
  }

  scheduledDestroyComponent(component: GlimmerComponent, meta: Meta) {
    if (component.isDestroyed) {
      return;
    }

    Ember.destroy(component);

    meta.setSourceDestroyed();
    component[DESTROYED] = true;
  }

  didCreateComponent() {}

  didUpdateComponent() {}

  getContext(component: CreateComponentResult) {
    return component;
  }
}

// In Ember 3.12 and earlier, the updateComponent hook was mandatory.
// As of Ember 3.13, the `args` object is stable and each property of the
// object participates in the autotrack stack on its own. This means we do not
// need to set the `args` property on the component instance to invalidate
// tracked getters that rely on `args`, and therefore don't require the `updateComponent`
// hook at all.
if (!gte('3.13.0-beta.1')) {
  GlimmerComponentManager.prototype.updateComponent = function updateComponent(component: CreateComponentResult, args: ComponentManagerArgs) {
      let argSnapshot = args.named;

      if (DEBUG) {
        argSnapshot = Object.freeze(argSnapshot);
      }

      set(component, 'args', argSnapshot);
  };
}
