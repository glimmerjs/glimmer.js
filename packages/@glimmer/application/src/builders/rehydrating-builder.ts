import DOMBuilder from './dom-builder';
import { RehydrateBuilder, Environment, NewElementBuilder } from "@glimmer/runtime";

export default class RehydratingBuilder extends DOMBuilder {
  getBuilder(env: Environment): NewElementBuilder {
    return RehydrateBuilder.forInitialRender(env, this.cursor);
  }
}
