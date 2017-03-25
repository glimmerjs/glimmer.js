import { Simple } from '@glimmer/runtime';

class Component {
  /**  */
  element: Simple.Element = null;
  /** Development-mode only name of the component, useful for debugging. */
  debugName: string = null;

  /** Named arguments passed to the component from its parent component. */
  args: object;

  static create(injections: any) {
    return new this(injections);
  }

  constructor(injections: object) {
    Object.assign(this, injections);
  }

  didInsertElement() { }
  didUpdate() { }

  toString() {
    return `${this.debugName} component`;
  }
}

export default Component;

export interface ComponentFactory {
  create(injections: object): Component;
}
