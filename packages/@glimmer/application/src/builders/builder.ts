import { ElementBuilder, Environment } from "@glimmer/runtime";

/**
 * A Builder encapsulates the building of template output. For example, in the
 * browser a builder might construct DOM elements, while on the server it may
 * instead construct HTML.
 */
export default interface Builder {
  getBuilder(env: Environment): ElementBuilder;
}
