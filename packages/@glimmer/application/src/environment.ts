import {
  DOMChanges,
  DOMTreeConstruction,
  EnvironmentImpl as GlimmerEnvironmentImpl,
} from '@glimmer/runtime';
import { Reference, OpaqueIterable } from '@glimmer/reference';
import { getOwner, setOwner, Owner } from '@glimmer/di';
import { SimpleDocument } from '@simple-dom/interface';

import { iterableFor } from './iterable';
import RuntimeResolver from './loaders/runtime-compiler/loader';
import { EnvironmentWithOwner } from '@glimmer/component';

/** @internal */
export interface EnvironmentOptions {
  document: HTMLDocument;
  appendOperations: DOMTreeConstruction;
}

/** @internal */
export default class EnvironmentImpl extends GlimmerEnvironmentImpl implements EnvironmentWithOwner {
  private uselessAnchor: HTMLAnchorElement;
  public resolver!: RuntimeResolver;

  static create(options: Partial<EnvironmentOptions> = {}) {
    options.document = options.document || self.document;
    options.appendOperations =
      options.appendOperations || new DOMTreeConstruction(options.document as SimpleDocument);

    return new EnvironmentImpl(options as EnvironmentOptions);
  }

  constructor(options: EnvironmentOptions) {
    super({
      appendOperations: options.appendOperations,
      updateOperations: new DOMChanges(options.document as SimpleDocument),
    });

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
