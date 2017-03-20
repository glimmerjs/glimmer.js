import { Element } from 'simple-html-tokenizer';

class Component {
  static create(injections) {
    return new this(injections);
  }

  constructor(injections: object) {
    Object.assign(this, injections);
  }

  element: Element;
}

export default Component;

export interface ComponentFactory {
  create(injections: object): Component;
}