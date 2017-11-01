import { TemplateIterator, RenderResult } from "@glimmer/runtime";
import { Renderer } from "../application";

interface Deadline {
  didTimeout: boolean;
  timeRemaining(): number;
}

type IdleCallback = (deadline: Deadline) => void;

interface RequestIdleCallbackOptions {
  timeout?: number;
}

declare function requestIdleCallback(
  callback: IdleCallback,
  options?: RequestIdleCallbackOptions
): void;

export interface AsyncRendererOptions {
  timeout?: number;
}

const DEFAULT_TIMEOUT = 250;

export default class AsyncRenderer implements Renderer {
  public timeout: number;
  protected result: RenderResult;

  constructor(options: AsyncRendererOptions = {}) {
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
  }

  render(iterator: TemplateIterator): Promise<void> {
    return new Promise((resolve) => {
      let timeout = this.timeout;

      let tick = (deadline: Deadline) => {
        let iteratorResult: IteratorResult<RenderResult>;

        do {
          iteratorResult = iterator.next();
        } while (!iteratorResult.done && deadline.timeRemaining() > 1);

        if (iteratorResult.done) {
          this.result = iteratorResult.value;
          return resolve();
        }

        requestIdleCallback(tick, { timeout });
      };

      requestIdleCallback(tick, { timeout });
    });
  }

  rerender(): void {
    if (!this.result) {
      throw new Error("Cannot re-render before initial render has completed");
    }

    this.result.rerender();
  }
}
