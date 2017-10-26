import DOMBuilder from './dom-builder';
import { rehydrationBuilder, Environment, ElementBuilder } from '@glimmer/runtime';

export default class RehydratingBuilder extends DOMBuilder {
  getBuilder(env: Environment): ElementBuilder {
    return rehydrationBuilder(env, this.cursor);
  }
}
