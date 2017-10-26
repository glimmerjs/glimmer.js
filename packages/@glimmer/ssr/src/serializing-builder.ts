import { DOMBuilder } from '@glimmer/application';
import { Environment, ElementBuilder } from '@glimmer/runtime';
import { serializeBuilder } from '@glimmer/node';

export default class SerializingBuilder extends DOMBuilder {
  getBuilder(env: Environment): ElementBuilder {
    return serializeBuilder(env, this.cursor);
  }
}
