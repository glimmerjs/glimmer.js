import { DEBUG } from '@glimmer/env';
import { ComponentManager, ComponentCapabilities } from '@glimmer/core';
import { Arguments } from '@glimmer/interfaces';
import BaseComponent, { ARGS_SET } from './component';

export interface Constructor<T> {
  new (owner: unknown, args: Record<string, unknown>): T;
}

export default abstract class BaseComponentManager<GlimmerComponent extends BaseComponent>
  implements ComponentManager<GlimmerComponent> {
  abstract capabilities: ComponentCapabilities;

  private owner: unknown;

  constructor(owner: unknown) {
    this.owner = owner;
  }

  createComponent(
    ComponentClass: Constructor<GlimmerComponent>,
    args: Arguments
  ): GlimmerComponent {
    if (DEBUG) {
      ARGS_SET.set(args.named, true);
    }

    return new ComponentClass(this.owner, args.named);
  }

  getContext(component: GlimmerComponent): GlimmerComponent {
    return component;
  }
}
