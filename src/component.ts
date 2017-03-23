import { Element } from 'simple-html-tokenizer';

class Component {
  /**  */
  element: Element = null;
  /** Development-mode only name of the component, useful for debugging. */
  debugName: string = null;

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