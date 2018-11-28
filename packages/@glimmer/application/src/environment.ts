import {
  DOMChanges,
  DOMTreeConstruction,
  Environment as GlimmerEnvironment
} from '@glimmer/runtime';
import {
  Reference,
  OpaqueIterable
} from "@glimmer/reference";
import { Opaque } from '@glimmer/util';
import {
  getOwner,
  setOwner,
  Owner
} from '@glimmer/di';
import { iterableFor } from './iterable';
import { Program } from '@glimmer/program';
import { ModuleLocator, Simple } from '@glimmer/interfaces';

import RuntimeResolver from './loaders/runtime-compiler/loader';

/** @internal */
export interface EnvironmentOptions {
  document: HTMLDocument;
  appendOperations: DOMTreeConstruction;
}

/** @internal */
export default class Environment extends GlimmerEnvironment {
  private uselessAnchor: HTMLAnchorElement;
  public resolver: RuntimeResolver;
  protected program: Program<ModuleLocator>;

  static create(options: Partial<EnvironmentOptions> = {}) {
    options.document = options.document || self.document;
    options.appendOperations = options.appendOperations || new DOMTreeConstruction(options.document as Simple.Document);

    return new Environment(options as EnvironmentOptions);
  }

  constructor(options: EnvironmentOptions) {
    super({ appendOperations: options.appendOperations, updateOperations: new DOMChanges(options.document as Simple.Document) });

    setOwner(this, getOwner(options));

    // TODO - required for `protocolForURL` - seek alternative approach
    // e.g. see `installPlatformSpecificProtocolForURL` in Ember
    this.uselessAnchor = options.document.createElement('a');
  }

  protocolForURL(url: string): string {
    // TODO - investigate alternative approaches
    // e.g. see `installPlatformSpecificProtocolForURL` in Ember
    this.uselessAnchor.href = url;
    return this.uselessAnchor.protocol;
  }

  iterableFor(ref: Reference<Opaque>, keyPath: string): OpaqueIterable {
    return iterableFor(ref, keyPath);
  }

  getOwner(): Owner {
    return getOwner(this);
  }

  setOwner(obj: Object, owner: Owner): void {
    setOwner(obj, owner);
  }
}
