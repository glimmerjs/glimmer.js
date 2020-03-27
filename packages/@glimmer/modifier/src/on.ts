/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { ModifierManager, modifierCapabilities, setModifierManager } from '@glimmer/core';

// This function is just used to have an importable value to assign the modifier manager
// to, so it doesn't actually get run. Having the typings is good for documentation
// and discoverabilitity purposes though.

export function on(
  // @ts-ignore
  element: Element,
  // @ts-ignore
  eventName: string,
  // @ts-ignore
  callBack: EventListenerOrEventListenerObject,
  // @ts-ignore
  options?: AddEventListenerOptions
): void {} // eslint-disable-line @typescript-eslint/no-empty-function

interface OnArgs {
  positional: [string, EventListenerOrEventListenerObject];
  named: AddEventListenerOptions;
}

interface OnStateBucket {
  element?: Element;
  args: OnArgs;
  previousArgs: OnArgs;
}

class OnModifierManager implements ModifierManager<OnStateBucket> {
  capabilities = modifierCapabilities('3.13');

  createModifier(_definition: {}, args: unknown): OnStateBucket {
    return { args: args as OnArgs, previousArgs: args as OnArgs };
  }

  installModifier(bucket: OnStateBucket, element: Element): void {
    const { args } = bucket;
    const [eventName, listener] = args.positional;
    const named = Object.assign({}, args.named);

    element.addEventListener(eventName, listener, named);

    bucket.element = element;
    bucket.previousArgs = {
      positional: [eventName, listener],
      named,
    };
  }

  updateModifier(bucket: OnStateBucket): void {
    this.destroyModifier(bucket);
    this.installModifier(bucket, bucket.element!);
  }

  destroyModifier({ element, previousArgs }: OnStateBucket): void {
    const [eventName, listener] = previousArgs.positional;
    element!.removeEventListener(eventName, listener, previousArgs.named);
  }
}

setModifierManager(() => new OnModifierManager(), on);
