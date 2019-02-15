import { clientBuilder } from '@glimmer/runtime';
import { Option, Cursor, Environment, ElementBuilder } from '@glimmer/interfaces';
import { Builder } from '../base-application';
import { SimpleElement, SimpleNode } from '@simple-dom/interface';

/**
 * Variant of Glimmer VM's Cursor interface that accepts either
 * native DOM or SimpleDOM types.
 */
export interface DOMCursor {
  element: Element | SimpleElement;
  nextSibling?: Option<Node | SimpleNode>;
}

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

  constructor({ element, nextSibling = null }: DOMCursor) {
    this.cursor = { element, nextSibling } as Cursor;
  }

  getBuilder(env: Environment): ElementBuilder {
    return clientBuilder(env, this.cursor);
  }
}
