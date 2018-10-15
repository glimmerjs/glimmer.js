import { iterableFor } from '@glimmer/application';
import { Environment as AbstractEnvironment } from '@glimmer/runtime';
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

export interface EnvironmentOptions {
  document: HTMLDocument;
}

export default class Environment extends AbstractEnvironment {
  static create(options: EnvironmentOptions): Environment {
    return new Environment(options);
  }

  constructor(options) {
    super({
      appendOperations: new NodeDOMTreeConstruction(options.document),
      updateOperations: undefined
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
