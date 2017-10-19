import { ElementBuilder, clientBuilder, TemplateIterator, templateFactory, RenderResult } from '@glimmer/runtime';
import { Simple, Opaque } from '@glimmer/interfaces';
import Environment from './environment';
import { UpdatableReference } from '@glimmer/object-reference';
import DynamicScope from './dynamic-scope';
import mainTemplate from './templates/main';

export default abstract class ApplicationDelegate {
  abstract elementBuilder(env: Environment, document: Simple.Document): ElementBuilder;
  abstract prepareMainLayout(env: Environment, self: UpdatableReference<Opaque>, scope: DynamicScope, elementBuilder: ElementBuilder): TemplateIterator;
  abstract render(templateIterator: TemplateIterator): RenderResult;
}

export class DefaultApplicationDelegate implements ApplicationDelegate {
  elementBuilder(env: Environment, document: Simple.Document): ElementBuilder {
    let cursor = {
      element: (document as Document).body,
      nextSibling: null
    };
    return clientBuilder(env, cursor);
  }

  prepareMainLayout(env: Environment, self: UpdatableReference<Opaque>, dynamicScope: DynamicScope, elementBuilder: ElementBuilder): TemplateIterator {
    let mainLayout = templateFactory(mainTemplate).create(env.compileOptions);
    return mainLayout.renderLayout({
      env,
      self,
      dynamicScope,
      builder: elementBuilder
    });
  }

  render(templateIterator: TemplateIterator): RenderResult {
    // Iterate the template iterator, executing the compiled template program
    // until there are no more instructions left to execute.
    let result;
    do {
      result = templateIterator.next();
    } while (!result.done);

    return result.value;
  }

}
