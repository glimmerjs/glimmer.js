import setGlobalContextVM from '@glimmer/global-context';
import { EnvironmentDelegate } from '@glimmer/runtime';
import { Option, Destructor, Destroyable } from '@glimmer/interfaces';
import { IteratorDelegate } from '@glimmer/reference';

import { isNativeIterable, NativeIterator } from './iterator';
import { DEBUG } from '@glimmer/env';
import toBool from './to-bool';

let scheduledDestroyables: Destroyable[] = [];
let scheduledDestructors: Destructor<object>[] = [];
let scheduledFinishDestruction: (() => void)[] = [];

export function setGlobalContext(scheduleRevalidate: () => void): void {
  setGlobalContextVM({
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

    setPath(obj: Record<string, unknown>, key: string, newValue: unknown) {
      if (DEBUG && key.includes('.')) {
        throw new Error(
          'You attempted to set a path with a `.` in it, but Glimmer.js does not support paths with dots.'
        );
      }

      obj[key] = newValue;
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

    assert(test: unknown, msg: string) {
      if (!test) {
        throw new Error(msg);
      }
    },

    deprecate(msg: string, test: unknown) {
      if (!test) {
        console.warn(msg);
      }
    },
  });
}

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
