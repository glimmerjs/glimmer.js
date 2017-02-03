import { getOwner, setOwner } from '@glimmer/di';
import { DirtyableTag } from '@glimmer/reference';
import { Simple } from '@glimmer/runtime';
import Environment from './environment';
import { ComponentOptions } from './component-options';

export default class Component {
  dirtinessTag = new DirtyableTag();
  element: Simple.Element = null;
  env: Environment = null;
  parent: Component = null;
  args: Object = null;

  constructor(options: ComponentOptions) {
    setOwner(this, getOwner(options));
    this.parent = options.parent;
    this.args = options.args;
  }
}
