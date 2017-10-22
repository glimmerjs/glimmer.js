import { Cursor, NewElementBuilder, Environment } from '@glimmer/runtime';
import Builder from '../builder';

export interface DOMBuilderOptions {
  element: Element;
  nextSibling?: Node;
}

export default class DOMBuilder implements Builder {
  protected cursor: Cursor;

  constructor({ element, nextSibling }: DOMBuilderOptions) {
    this.cursor = {
      element,
      nextSibling: nextSibling || null
    };
  }

  getBuilder(env: Environment) {
    return NewElementBuilder.forInitialRender(env, this.cursor);
  }
}
