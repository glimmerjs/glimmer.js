import { iterableFor } from '@glimmer/application';
import { Environment as AbstractEnvironment, DOMTreeConstruction } from '@glimmer/runtime';
import { NodeDOMTreeConstruction } from '@glimmer/node';
import {
  getOwner,
  setOwner
} from '@glimmer/di';
import {
  Reference,
  OpaqueIterable
} from "@glimmer/reference";
import { Opaque } from '@glimmer/util';
import { parse } from 'url';
import { Simple } from '@glimmer/interfaces';
import { Document } from 'simple-dom';

/**
 * Server-side environment that can be used to configure the glimmer-vm to work on the server side.
 */
export default class Environment extends AbstractEnvironment {
  static create(): Environment {
    return new Environment({
      // Note: This is not the actual document being rendered to. This is simply used for creating elements, attributes etc.
      // The actual html node being rendered to is passed into the builder.
      document: new Document()
    });
  }

  constructor(options) {
    super({
      // This type coercion is caused by problems with Glimmer VM's types. Should
      // be resolved once Glimmer VM is updated to the latest SimpleDOM.
      appendOperations: (new NodeDOMTreeConstruction(options.document as any as Simple.Document) as any as DOMTreeConstruction),
      updateOperations: undefined // SSR does not have updateOperations
    });

    setOwner(this, getOwner(options));
  }

  protocolForURL(url: string): string {
    const urlObject = parse(url);
    return urlObject && urlObject.protocol;
  }

  iterableFor(ref: Reference<Opaque>, keyPath: string): OpaqueIterable {
    return iterableFor(ref, keyPath);
  }
}
