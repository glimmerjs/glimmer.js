import {
  DOMChanges,
  DOMTreeConstruction,
  EnvironmentImpl as GlimmerEnvironmentImpl,
} from '@glimmer/runtime';
import { Reference, OpaqueIterable } from '@glimmer/reference';
import { SimpleDocument } from '@simple-dom/interface';

import { iterableFor } from './iterable';

/** @internal */
export interface EnvironmentOptions {
  document: HTMLDocument;
  appendOperations: DOMTreeConstruction;
}

/** @internal */
export default class EnvironmentImpl extends GlimmerEnvironmentImpl {
  private uselessAnchor: HTMLAnchorElement;

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
}
