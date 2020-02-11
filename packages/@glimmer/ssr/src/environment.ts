import { iterableFor } from '@glimmer/core';
import { NodeDOMTreeConstruction } from '@glimmer/node';
import { Reference, OpaqueIterable } from '@glimmer/reference';
import { EnvironmentImpl as GlimmerEnvironmentImpl } from '@glimmer/runtime';

import createHTMLDocument from '@simple-dom/document';
import { SimpleDocument } from '@simple-dom/interface';
import { parse } from 'url';

interface EnvironmentOptions {
  document: SimpleDocument;
}

/**
 * Server-side environment that can be used to configure the glimmer-vm to work on the server side.
 */
export default class EnvironmentImpl extends GlimmerEnvironmentImpl {
  static create(): EnvironmentImpl {
    return new EnvironmentImpl({
      // Note: This is not the actual document being rendered to. This is simply used for creating elements, attributes etc.
      // The actual html node being rendered to is passed into the builder.
      document: createHTMLDocument(),
    });
  }

  constructor(options: EnvironmentOptions) {
    super({
      appendOperations: new NodeDOMTreeConstruction(options.document),
      updateOperations: undefined!, // SSR does not have updateOperations
    });
  }

  protocolForURL(url: string): string {
    const urlObject = parse(url);
    return (urlObject && urlObject.protocol) || 'https';
  }

  iterableFor(ref: Reference<unknown>, keyPath: string): OpaqueIterable {
    return iterableFor(ref, keyPath);
  }

  getOwner(): unknown {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setOwner(): void {}
}
