import { BaseApplication, Loader, Renderer } from '@glimmer/application';
import { Resolver, Dict } from '@glimmer/di';
import Environment from './environment';
import { Opaque } from '@glimmer/util';
import StringBuilder from './string-builder';
import { Document, HTMLSerializer, voidMap } from 'simple-dom';
import { PathReference, ConstReference } from '@glimmer/reference';
import { Duplex } from 'stream';

export interface SSRApplicationOptions {
  rootName: string;
  resolver: Resolver;
  loader: Loader;
  renderer: Renderer;
}

function convertOpaqueToReferenceDict(data: Opaque): Dict<PathReference<Opaque>> {
  if (!data) {
    return {};
  };

  return Object.keys(data).reduce((acc, key) => {
    acc[key] = new ConstReference(data[key]);
    return acc;
  }, {});
}

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
  }

  async renderToStream(componentName: string, data: Opaque, stream: NodeJS.WritableStream) {
    const env = this.lookup(`environment:/${this.rootName}/main/main`);

    const doc = new Document();

    const builder = new StringBuilder({
      element: doc.body,
      nextSibling: null
    }).getBuilder(env);

    const templateIterator = await this.loader.getComponentTemplateIterator(this, env, builder, componentName, convertOpaqueToReferenceDict(data));

    env.begin();
    await this.renderer.render(templateIterator);
    env.commit();

    stream.write(this.serializer.serializeChildren(doc.body));
    stream.end();
  }

  async renderToString(componentName: string, data: Opaque) {
    return new Promise((resolve, reject) => {
      const stream = new Duplex();
      let html = '';

      stream.on('data', (str) => html += str);
      stream.on('end', () => resolve(html));
      stream.on('error', (err) => reject(err));

      this.renderToStream(componentName, data, stream);
    });
  }
}
