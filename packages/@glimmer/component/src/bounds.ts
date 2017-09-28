import { Bounds as VMBounds } from '@glimmer/runtime';

/**
 * Contains the first and last DOM nodes in a component's rendered
 * template. These nodes can be used to traverse the section of DOM
 * that belongs to a particular component.
 *
 * Note that these nodes *can* change over the lifetime of a component
 * if the beginning or ending of the template is dynamic.
 */
export default class Bounds {
  constructor(private _bounds: VMBounds) {
  }

  get firstNode(): Node {
    return this._bounds.firstNode() as Node;
  }

  get lastNode(): Node {
    return this._bounds.lastNode() as Node;
  }
}
