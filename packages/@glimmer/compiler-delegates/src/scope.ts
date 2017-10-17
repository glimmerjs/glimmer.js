export interface Import {
  name: string;
  module: string;
}

/**
 * Contains the set of imports in scope, keyed on the local identifier.
 *
 * For example, the file with contents:
 *
 *     import Foo from 'bar';
 *     import { foo, bar as baz } from 'quux';
 *
 * Would have a scope of:
 *     {
 *       Foo: { export: 'default', module: 'bar' },
 *       foo: { export: 'foo', module: 'quux' },
 *       baz: { export: 'bar', module: 'quux' }
 *     }
 */
export default interface Scope {
  [identifier: string]: Import;
}
