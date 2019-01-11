import { DOMBuilder } from "@glimmer/application";
import { serializeBuilder } from "@glimmer/node";
import { Environment, ElementBuilder } from "@glimmer/interfaces";

export default class SerializingBuilder extends DOMBuilder {
  getBuilder(env: Environment): ElementBuilder {
    return serializeBuilder(env, this.cursor);
  }
}
