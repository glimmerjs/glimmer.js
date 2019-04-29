import { Renderer } from '../base-application';
import { RenderResult, TemplateIterator } from '@glimmer/interfaces';

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

/**
 * Performs an asynchronous initial render of templates using
 * requestIdleCallback.
 *
 * @remarks
 * The AsyncRenderer instructs Glimmer to perform the initial render
 * asynchronously. That is, it will yield back control of the main thread to the
 * browser every so often, so that the browser may respond to user events like
 * taps or scrolls so a user's device remains responsive.
 *
 * Rather than completing the initial render as fast as possible, by consuming
 * all of the main thread's resources until the render is complete, the
 * AsyncRenderer instructs the VM to execute operations for a few milliseconds
 * at a time.
 *
 * Afer a few milliseconds, the AsyncRenderer will pause rendering, schedule
 * more rendering to happen in the future, then yield control back to the
 * browser. This process continues until there are no more instructions for the
 * VM to execute and the initial render is complete.
 *
 * Under the hood, work is scheduled using
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback | requestIdleCallback},
 * which allows JavaScript programs to queue work to happen during idle periods.
 *
 * @public
 */
export default class AsyncRenderer implements Renderer {
  public timeout: number;
  protected result: RenderResult | null = null;

  constructor(options: AsyncRendererOptions = {}) {
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
  }

  render(iterator: TemplateIterator): Promise<void> {
    return new Promise(resolve => {
      let timeout = this.timeout;

      let tick = (deadline: Deadline) => {
        let iteratorResult: IteratorResult<RenderResult | null>;

        do {
          iteratorResult = iterator.next();
        } while (!iteratorResult.done && deadline.timeRemaining() > 1);

        if (iteratorResult.done) {
          this.result = iteratorResult.value!;
          return resolve();
        }

        requestIdleCallback(tick, { timeout });
      };

      requestIdleCallback(tick, { timeout });
    });
  }

  rerender(): void {
    if (!this.result) {
      throw new Error('Cannot re-render before initial render has completed');
    }

    this.result.rerender();
  }
}
