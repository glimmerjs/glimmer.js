import { getOwner, setOwner, Owner, OWNER } from '@glimmer/di';
import { DirtyableTag } from '@glimmer/reference';
import { Simple } from '@glimmer/runtime';
import Environment from './environment';

export default class Component {
  dirtinessTag = new DirtyableTag();
  element: Simple.Element = null;
  env: Environment = null;
  parent: Component = null;
  args: Object = null;

  static create(args?: Object): Component {
    return new Component(args);
  }

  constructor(args: Object = {}) {
    let owner: Owner = getOwner(args);
    if (owner) {
      setOwner(this, owner);
      delete args[OWNER];
    }
    this.args = args;
  }
}
