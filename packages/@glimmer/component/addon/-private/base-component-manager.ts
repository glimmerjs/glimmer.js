import { DEBUG } from '@glimmer/env';
import BaseComponent, { ARGS_SET } from './component';

export interface ComponentManagerArgs {
  named: object;
  positional: any[];
}

export type SetOwner = (obj: {}, owner: unknown) => void;
export type GetOwner = (obj: {}) => unknown;

export interface CustomComponentCapabilities {
  asyncLifecycleCallbacks: boolean;
  destructor: boolean;
  updateHook: boolean;
}

export interface Constructor<T> {
  new (owner: unknown, args: {}): T;
}

/**
 * This factory function returns a component manager class with common behavior
 * that can be extend to add Glimmer.js- or Ember.js-specific functionality. As
 * these environments converge, the need for two component manager
 * implementations (and thus this factory) should go away.
 */
export default function BaseComponentManager<GlimmerComponent extends BaseComponent>(
  setOwner: SetOwner,
  getOwner: GetOwner,
  capabilities: CustomComponentCapabilities
) {
  return class {
    static create(attrs: {}) {
      let owner = getOwner(attrs);
      return new this(owner);
    }

    capabilities = capabilities;

    constructor(owner: unknown) {
      setOwner(this, owner);
    }

    createComponent(
      ComponentClass: Constructor<GlimmerComponent>,
      args: ComponentManagerArgs
    ): GlimmerComponent {
      if (DEBUG) {
        ARGS_SET.set(args.named, true);
      }

      return new ComponentClass(getOwner(this), args.named);
    }

    getContext(component: GlimmerComponent) {
      return component;
    }
  };
}
