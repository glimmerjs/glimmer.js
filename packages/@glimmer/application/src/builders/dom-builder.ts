import { Cursor, NewElementBuilder, Environment } from "@glimmer/runtime";
import { Builder } from "../application";

export default class DOMBuilder implements Builder {
  protected cursor: Cursor;

  constructor({ element, nextSibling = null }: Cursor) {
    this.cursor = { element, nextSibling };
  }

  getBuilder(env: Environment) {
    return NewElementBuilder.forInitialRender(env, this.cursor);
  }
}
