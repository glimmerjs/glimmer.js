import { iterableFor } from '@glimmer/application';
import { NodeDOMTreeConstruction } from '@glimmer/node';
import { getOwner, setOwner, Owner } from '@glimmer/di';
import { Reference, OpaqueIterable } from '@glimmer/reference';
import { EnvironmentImpl as GlimmerEnvironmentImpl } from '@glimmer/runtime';
import { EnvironmentWithOwner } from '@glimmer/component';

import createHTMLDocument from '@simple-dom/document';
import { parse } from 'url';

/**
 * Server-side environment that can be used to configure the glimmer-vm to work on the server side.
 */
export default class EnvironmentImpl extends GlimmerEnvironmentImpl implements EnvironmentWithOwner {
  static create(): EnvironmentImpl {
    return new EnvironmentImpl({
      // Note: This is not the actual document being rendered to. This is simply used for creating elements, attributes etc.
      // The actual html node being rendered to is passed into the builder.
      document: createHTMLDocument(),
    });
  }

  constructor(options) {
    super({
      appendOperations: new NodeDOMTreeConstruction(options.document),
      updateOperations: undefined, // SSR does not have updateOperations
    });

    setOwner(this, getOwner(options));
  }

  protocolForURL(url: string): string {
    const urlObject = parse(url);
    return urlObject && urlObject.protocol;
  }

  iterableFor(ref: Reference<unknown>, keyPath: string): OpaqueIterable {
    return iterableFor(ref, keyPath);
  }

  getOwner(): Owner {
    return getOwner(this);
  }
  setOwner(obj: Object, owner: Owner): void {
    setOwner(obj, owner);
  }
}
