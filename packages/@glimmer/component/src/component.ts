import { metaFor, trackedGet } from '@glimmer/tracking';
import { CURRENT_TAG } from '@glimmer/reference';

import GlimmerComponent from '../addon/-private/component';

export default class Component extends GlimmerComponent<any> {
  get args() {
    trackedGet(this, 'args');
    return this.__args__;
  }

  set args(args) {
    this.__args__ = args;
    metaFor(this)
      .updatableTagFor('args')
      .inner.update(CURRENT_TAG);
  }

  /** @private
   * Slot on the component to save Arguments object passed to the `args` setter.
   */
  private __args__: any;

  // static create(injections: any) {
  //   return new this(injections);
  // }

  /**
   * Development-mode only name of the component, useful for debugging.
   */
  debugName: string | null = null;

  toString() {
    return `${this.debugName} component`;
  }
}

export interface ComponentFactory {
  create(injections: object): Component;
}
