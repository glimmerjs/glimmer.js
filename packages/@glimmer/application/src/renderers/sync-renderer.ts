import { TemplateIterator, RenderResult } from '@glimmer/runtime';
import { Renderer } from '../application';

export default class SyncRenderer implements Renderer {
  result: RenderResult;

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
