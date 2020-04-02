import { ComponentDefinition, getTemplateIterator } from '@glimmer/core';
import { Dict } from '@glimmer/interfaces';
import createHTMLDocument from '@simple-dom/document';
import HTMLSerializer from '@simple-dom/serializer';
import voidMap from '@simple-dom/void-map';
import { PassThrough } from 'stream';
import { parse } from 'url';
import { BaseEnvDelegate } from '@glimmer/core';
import { NodeDOMTreeConstruction } from '@glimmer/node';
import { DOMChanges } from '@glimmer/runtime';

/**
 * Server-side environment that can be used to configure the glimmer-vm to work
 * on the server side.
 *
 * @internal
 */
class ServerEnvDelegate extends BaseEnvDelegate {
  isInteractive = false;

  protocolForURL(url: string): string {
    const urlObject = parse(url);
    return (urlObject && urlObject.protocol) || 'https';
  }
}

export interface RenderOptions {
  args?: Dict<unknown>;
  serializer?: HTMLSerializer;
  owner?: object;
}

const defaultSerializer = new HTMLSerializer(voidMap);

export function renderToString(
  ComponentClass: ComponentDefinition,
  options?: RenderOptions
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const stream = new PassThrough();
    let html = '';

    stream.on('data', (str) => (html += str));
    stream.on('end', () => resolve(html));
    stream.on('error', (err) => reject(err));

    renderToStream(stream, ComponentClass, options);
  });
}

export function renderToStream(
  stream: NodeJS.WritableStream,
  ComponentClass: ComponentDefinition,
  options: RenderOptions = {}
): void {
  const document = createHTMLDocument();
  const element = document.body;
  const appendOperations = new NodeDOMTreeConstruction(document);

  // TODO: Remove in Glimmer VM 0.48, it's not necessary
  const updateOperations = new DOMChanges(document);

  const iterator = getTemplateIterator(
    ComponentClass,
    element,
    { appendOperations, updateOperations },
    new ServerEnvDelegate(),
    options.args,
    options.owner
  );
  iterator.sync();

  const serializer = options.serializer || defaultSerializer;

  stream.write(serializer.serializeChildren(element));
  stream.end();
}
