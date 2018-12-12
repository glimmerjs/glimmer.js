import Application, { RuntimeCompilerLoader, DOMBuilder, SyncRenderer } from '@glimmer/application';
import { BlankResolver } from './resolvers';
import { Simple } from '@glimmer/interfaces';

export function createApp(options: Object) {
  let resolver = new BlankResolver();
  let builder = new DOMBuilder({ element: document.body as Simple.Element, nextSibling: null });
  let loader = new RuntimeCompilerLoader(resolver);
  let renderer = new SyncRenderer();
  return new Application(Object.assign({
    rootName: 'app',
    resolver,
    builder,
    loader,
    renderer
  }, options));
}
