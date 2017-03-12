import { getOwner, setOwner } from '@glimmer/di';
import { DirtyableTag } from '@glimmer/reference';
import { Simple, Environment } from '@glimmer/runtime';

export interface ComponentOptions {
  parent?: Component;
  hasBlock?: boolean;
  // TODO dispatcher: EventDispatcher;
  args?: Object;
}

export default class Component {
  dirtinessTag = new DirtyableTag();
  element: Simple.Element = null;
  env: Environment = null;
  parent: Component = null;
  args: Object = null;

  static create(options: ComponentOptions) {
    return new this(options);
  }

  constructor(options: ComponentOptions) {
    setOwner(this, getOwner(options));
    this.parent = options.parent;
    this.args = options.args;
    // TODO options.hasBlock
  }
}
