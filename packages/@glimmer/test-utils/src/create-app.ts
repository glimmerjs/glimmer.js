import Application, { RuntimeCompilerLoader, DOMBuilder, SyncRenderer } from '@glimmer/application';
import { BlankResolver } from './resolvers';

export function createApp(options: Object) {
  let resolver = new BlankResolver();
  let builder = new DOMBuilder({ element: document.body });
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
