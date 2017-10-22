import { Environment, TemplateIterator } from "@glimmer/runtime";
import Builder from '../builders/builder';

export default interface Loader {
  getTemplateIterator(env: Environment, builder: Builder): TemplateIterator | Promise<TemplateIterator>;
}
