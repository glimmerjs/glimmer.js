import DOMBuilder from './dom-builder';
import { rehydrationBuilder, Environment, ElementBuilder } from '@glimmer/runtime';

/**
 * A {@link Builder} that re-uses existing DOM provided via server-side rendering.
 *
 * The RehydratingBuilder attempts to use the DOM produced by SSR-generated HTML
 * during template rendering. This allows components to "rehydrate" existing DOM
 * elements, making initial render faster and preventing the browser from having
 * to perform additional layout and paint operations.
 *
 * @public
 */
export default class RehydratingBuilder extends DOMBuilder {
  getBuilder(env: Environment): ElementBuilder {
    return rehydrationBuilder(env, this.cursor);
  }
}
