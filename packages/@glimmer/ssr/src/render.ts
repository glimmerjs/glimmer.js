import { ComponentFactory, getTemplateIterator } from '@glimmer/core';
import { Dict } from '@glimmer/interfaces';
import createHTMLDocument from '@simple-dom/document';
import HTMLSerializer from '@simple-dom/serializer';
import voidMap from '@simple-dom/void-map';
import { PassThrough } from 'stream';
import EnvironmentImpl from './environment';

export interface RenderOptions {
  args?: Dict<unknown>;
  serializer?: HTMLSerializer;
}

const defaultSerializer = new HTMLSerializer(voidMap);

export function renderToString(
  ComponentClass: ComponentFactory,
  options?: RenderOptions
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const stream = new PassThrough();
    let html = '';

    stream.on('data', str => (html += str));
    stream.on('end', () => resolve(html));
    stream.on('error', err => reject(err));

    renderToStream(stream, ComponentClass, options);
  });
}

export function renderToStream(
  stream: NodeJS.WritableStream,
  ComponentClass: ComponentFactory,
  options: RenderOptions = {}
): void {
  const element = createHTMLDocument().body;
  const iterator = getTemplateIterator(
    ComponentClass,
    element,
    EnvironmentImpl.create(),
    options.args
  );
  iterator.sync();

  const serializer = options.serializer || defaultSerializer;

  stream.write(serializer.serializeChildren(element));
  stream.end();
}
