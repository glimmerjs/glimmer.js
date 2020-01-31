import { ModifierManager, VMArguments, CapturedArguments } from '@glimmer/interfaces';
import { SimpleElement } from '@simple-dom/interface';
import { Tag, CONSTANT_TAG } from '@glimmer/validator';

class OnModifierState {
  public element: Element;
  private args: CapturedArguments;
  public tag: Tag;

  public eventName: string;
  public callback: EventListener;

  public shouldUpdate = true;

  constructor(element: Element, args: CapturedArguments) {
    this.element = element;
    this.args = args;
    this.tag = args.tag;
  }

  updateFromArgs() {
    let { args } = this;

    let eventName = args.positional.at(0).value() as string;

    if (eventName !== this.eventName) {
      this.eventName = eventName;
      this.shouldUpdate = true;
    }

    let callback = args.positional.at(1).value() as EventListener;

    if (callback !== this.callback) {
      this.callback = callback;
      this.shouldUpdate = true;
    }
  }

  destroy() {
    this.element.removeEventListener(this.eventName, this.callback);
  }
}

class OnModifierManager implements ModifierManager<OnModifierState | null, null> {
  public isInteractive: boolean;

  constructor() {
    this.isInteractive = typeof document !== 'undefined';
  }

  create(element: SimpleElement, _state: null, args: VMArguments): OnModifierState | null {
    if (!this.isInteractive) {
      return null;
    }

    const capturedArgs = args.capture();
    return new OnModifierState(<Element>element, capturedArgs);
  }

  getTag(state: OnModifierState | null): Tag {
    if (state === null) {
      return CONSTANT_TAG;
    }
    return state.tag;
  }

  install(state: OnModifierState | null): void {
    if (state === null) {
      return;
    }

    state.updateFromArgs();

    const { element, eventName, callback } = state;
    element.addEventListener(eventName, callback);

    state.shouldUpdate = false;
  }

  update(state: OnModifierState | null): void {
    if (state === null) {
      return;
    }

    // stash prior state for el.removeEventListener
    const { element, eventName, callback } = state;

    state.updateFromArgs();

    if (!state.shouldUpdate) {
      return;
    }

    // use prior state values for removal
    element.removeEventListener(eventName, callback);

    // read updated values from the state object
    state.element.addEventListener(state.eventName, state.callback);

    state.shouldUpdate = false;
  }

  getDestructor(state: OnModifierState | null) {
    return state;
  }
}

export const on = {
  state: null,
  manager: new OnModifierManager(),
};
