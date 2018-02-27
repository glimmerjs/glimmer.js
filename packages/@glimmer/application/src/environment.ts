import {
  DOMChanges,
  DOMTreeConstruction,
  Environment as GlimmerEnvironment
} from '@glimmer/runtime';
import {
  Reference,
  OpaqueIterable
} from "@glimmer/reference";
import { Opaque, expect } from '@glimmer/util';
import {
  getOwner,
  setOwner,
  Owner
} from '@glimmer/di';
import Iterable from './iterable';
import { Program } from '@glimmer/program';
import { TemplateOptions } from '@glimmer/opcode-compiler';
import { ModuleLocator } from '@glimmer/interfaces';

import RuntimeResolver from './loaders/runtime-compiler/loader';

type KeyFor<T> = (item: Opaque, index: T) => string;

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
  public compileOptions: TemplateOptions<ModuleLocator>;

  static create(options: Partial<EnvironmentOptions> = {}) {
    let document = expect(options.document || self.document, 'Global document not found. You must supply a document');
    let appendOperations = options.appendOperations || new DOMTreeConstruction(document);

    return new Environment({
      document,
      appendOperations
    }, getOwner(options));
  }

  constructor(options: EnvironmentOptions, owner?: Owner) {
    super({ appendOperations: options.appendOperations, updateOperations: new DOMChanges(options.document) });

    setOwner(this, owner || getOwner(options));

    // TODO - required for `protocolForURL` - seek alternative approach
    // e.g. see `installPlatformSpecificProtocolForURL` in Ember
    this.uselessAnchor = options.document.createElement('a') as HTMLAnchorElement;
  }

  protocolForURL(url: string): string {
    // TODO - investigate alternative approaches
    // e.g. see `installPlatformSpecificProtocolForURL` in Ember
    this.uselessAnchor.href = url;
    return this.uselessAnchor.protocol;
  }

  iterableFor(ref: Reference<Opaque>, keyPath: string): OpaqueIterable {
    let keyFor: KeyFor<Opaque>;

    if (!keyPath) {
      throw new Error('Must specify a key for #each');
    }

    switch (keyPath) {
      case '@index':
        keyFor = (_, index: number) => String(index);
      break;
      case '@primitive':
        keyFor = (item: Opaque) => String(item);
      break;
      default:
        keyFor = (item: Opaque) => item && item[keyPath];
      break;
    }

    return new Iterable(ref, keyFor);
  }
}
