import { Cursor, NewElementBuilder, Environment } from "@glimmer/runtime";
import { Simple } from '@glimmer/interfaces';
import { Builder } from "../application";

export interface DOMBuilderOptions {
  element: Simple.Element;
  nextSibling?: Simple.Node;
}

export default class DOMBuilder implements Builder {
  protected cursor: Cursor;

  constructor({ element, nextSibling = null }: DOMBuilderOptions) {
    this.cursor = { element, nextSibling };
  }

  getBuilder(env: Environment) {
    return NewElementBuilder.forInitialRender(env, this.cursor);
  }
}
