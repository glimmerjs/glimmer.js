import { Renderer } from '../base-application';
import { RenderResult, TemplateIterator } from '@glimmer/interfaces';

/**
 * Performs a synchronous initial render of templates.
 *
 * @remarks
 *
 * The SyncRenderer will render a template as fast as possible, continuing to
 * work until the template has been completely rendered.
 *
 * While this delivers the fastest absolute rendering performance, large
 * templates may cause the main thread to be consumed for long periods of time,
 * leading to user-noticeable performance degradation, or jank.
 *
 * See also: {@link AsyncRenderer}
 *
 * @public
 */
export default class SyncRenderer implements Renderer {
  result: RenderResult | null = null;

  render(iterator: TemplateIterator): void {
    // Iterate the template iterator, executing the compiled template program
    // until there are no more instructions left to execute.
    let result;
    do {
      result = iterator.next();
    } while (!result.done);

    this.result = result.value;
  }

  rerender(): void {
    if (!this.result) {
      throw new Error('Cannot re-render before initial render has completed');
    }

    this.result.rerender();
  }
}
