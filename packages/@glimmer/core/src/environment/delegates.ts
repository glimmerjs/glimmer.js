import setGlobalContext from '@glimmer/global-context';
import { EnvironmentDelegate } from '@glimmer/runtime';
import { Option, Destructor, Destroyable } from '@glimmer/interfaces';
import { IteratorDelegate } from '@glimmer/reference';

import { isNativeIterable, NativeIterator } from './iterator';
import { DEBUG } from '@glimmer/env';
import toBool from './to-bool';
import { scheduleRevalidate } from '../render-component';

let scheduledDestroyables: Destroyable[] = [];
let scheduledDestructors: Destructor<object>[] = [];
let scheduledFinishDestruction: (() => void)[] = [];

setGlobalContext({
  getProp(obj: Record<string, unknown>, key: string) {
    return obj[key];
  },

  setProp(obj: Record<string, unknown>, key: string, newValue: unknown) {
    obj[key] = newValue;
  },

  getPath(obj: Record<string, unknown>, key: string) {
    if (DEBUG && key.includes('.')) {
      throw new Error(
        'You attempted to get a path with a `.` in it, but Glimmer.js does not support paths with dots.'
      );
    }

    return obj[key];
  },

  scheduleRevalidate,

  toBool,

  toIterator(value: unknown): Option<IteratorDelegate> {
    if (isNativeIterable(value)) {
      return NativeIterator.from(value);
    }

    return null;
  },

  scheduleDestroy(destroyable, destructor) {
    scheduledDestroyables.push(destroyable);
    scheduledDestructors.push(destructor);
  },

  scheduleDestroyed(fn) {
    scheduledFinishDestruction.push(fn);
  },

  warnIfStyleNotTrusted() {
    // Do nothing
  },
});

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

  enableDebugTooling = false;
  owner = {};

  onTransactionCommit(): void {
    for (let i = 0; i < scheduledDestroyables.length; i++) {
      scheduledDestructors[i](scheduledDestroyables[i]);
    }

    scheduledFinishDestruction.forEach((fn) => fn());

    scheduledDestroyables = [];
    scheduledDestructors = [];
    scheduledFinishDestruction = [];
  }
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
