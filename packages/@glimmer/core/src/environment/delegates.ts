import { EnvironmentDelegate } from '@glimmer/runtime';
import { Option, Dict } from '@glimmer/interfaces';
import { IteratorDelegate } from '@glimmer/reference';

import { isNativeIterable, NativeIterator } from './iterator';
import { DEBUG } from '@glimmer/env';
import toBool from './to-bool';

/**
 * The environment delegate base class shared by both the client and SSR
 * environments. Contains shared definitions, but requires user to specify
 * `isInteractive` and a method for getting the protocols of URLs.
 *
 * @internal
 */
export abstract class BaseEnvDelegate implements EnvironmentDelegate {
  abstract isInteractive: boolean;
  abstract protocolForURL(url: string): string;

  // Match Ember's toBool semantics for cross-compatibility
  toBool = toBool;

  toIterator(value: unknown): Option<IteratorDelegate> {
    if (isNativeIterable(value)) {
      return NativeIterator.from(value);
    }

    return null;
  }
}

if (DEBUG) {
  // This is only possible in `key` on {{each}}
  (BaseEnvDelegate.prototype as EnvironmentDelegate).getPath = (
    obj: unknown,
    path: string
  ): unknown => {
    if (path.includes('.')) {
      throw new Error(
        'You attempted to get a path with a `.` in it, but Glimmer.js does not support paths with dots.'
      );
    }

    return (obj as Dict)[path];
  };
}

/**
 * The client specific environment delegate.
 *
 * @internal
 */
export class ClientEnvDelegate extends BaseEnvDelegate {
  isInteractive = true;

  private uselessAnchor = self.document.createElement('a');

  protocolForURL = (url: string): string => {
    // TODO - investigate alternative approaches
    // e.g. see `installPlatformSpecificProtocolForURL` in Ember
    this.uselessAnchor.href = url;
    return this.uselessAnchor.protocol;
  };
}
