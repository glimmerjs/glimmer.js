import { BaseApplication, Loader, Renderer } from '@glimmer/application';
import { ComponentManager } from '@glimmer/component';
import { Resolver, Dict } from '@glimmer/di';
import { Opaque } from '@glimmer/util';
import { PathReference, ConstReference } from '@glimmer/reference';

import { PassThrough } from 'stream';
import createHTMLDocument from '@simple-dom/document';
import HTMLSerializer from '@simple-dom/serializer';
import voidMap from '@simple-dom/void-map';

import Environment from './environment';
import StringBuilder from './string-builder';

export interface SSRApplicationOptions {
  rootName: string;
  resolver: Resolver;
  loader: Loader;
  renderer: Renderer;
}

/**
 * Converts a POJO into a dictionary of references that can be passed as an argument to render a component.
 */
function convertOpaqueToReferenceDict(data: Dict<Opaque>): Dict<PathReference<Opaque>> {
  if (!data) {
    return {};
  };

  return Object.keys(data).reduce((acc, key) => {
    acc[key] = new ConstReference(data[key]);
    return acc;
  }, {});
}

// TODO: Move out container setup out of here so that we can reuse the same application instance / registry across requests.
export default class Application extends BaseApplication {
  protected serializer: HTMLSerializer;

  constructor({rootName, resolver, loader, renderer}: SSRApplicationOptions) {
    super({
      rootName,
      resolver,
      loader,
      renderer,
      environment: Environment
    });

    this.serializer = new HTMLSerializer(voidMap);
    this.registerInitializer({
      initialize(registry) {
        registry.register(`component-manager:/${rootName}/component-managers/main`, ComponentManager);
      }
    });

    // Setup registry and DI
    this.initialize();
  }

  static async renderToStream(componentName: string, data: Dict<Opaque>, stream: NodeJS.WritableStream, options: SSRApplicationOptions) {
    const app = new Application(options);
    try {
      const env = app.lookup(`environment:/${app.rootName}/main/main`);
      const element = createHTMLDocument().body;

      const builder = new StringBuilder({ element }).getBuilder(env);

      const templateIterator = await app.loader.getComponentTemplateIterator(app, env, builder, componentName, convertOpaqueToReferenceDict(data));

      env.begin();
      await app.renderer.render(templateIterator);
      env.commit();
      stream.write(app.serializer.serializeChildren(element));
      stream.end();
    } catch (err) {
      stream.emit('error', err);
    }
  }

  static async renderToString(componentName: string, data: Dict<Opaque>, options: SSRApplicationOptions): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const stream = new PassThrough();
      let html = '';

      stream.on('data', (str) => html += str);
      stream.on('end', () => resolve(html));
      stream.on('error', (err) => reject(err));

      this.renderToStream(componentName, data, stream, options);
    });
  }
}
