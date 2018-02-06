import { Cursor, clientBuilder, Environment, ElementBuilder } from "@glimmer/runtime";
import { Builder } from "../application";

/**
 * A {@link Builder} that creates DOM elements when templates render.
 *
 * Use a DOMBuilder for Glimmer.js applications that do not use server-side
 * rendering. If you are using server-side rendering, the
 * {@link RehydratingBuilder} can be used to rehydrate existing DOM instead of
 * replacing it.
 *
 * @public
 */
export default class DOMBuilder implements Builder {
  protected cursor: Cursor;

  constructor({ element, nextSibling = null }: Cursor) {
    this.cursor = { element, nextSibling };
  }

  getBuilder(env: Environment): ElementBuilder {
    return clientBuilder(env, this.cursor);
  }
}
