type ValidateStructure<T, Struct> =
  T extends Struct ?
  Exclude<keyof T, keyof Struct> extends never ? T : never : never;

/**
 * Validates the _keys_ of an object. This tells us that it has exactly the
 * keys that we expect to exist, preventing new APIs from being added and old
 * APIs from being removed, but does not give us safety around the _types_ of
 * those values. e.g.
 *
 * ```ts
 * // This passes, but is not correct
 * hasExactKeys<{ foo: any }>()({ foo: 123 });
 *
 * // This also passes, but is not correct
 * let obj: { foo: any } = { foo: undefined };
 * hasExactKeys<{ foo: number }>()(obj);
 * ```
 *
 * In general, you should use this to verify keys using `unknown`, then use
 * `$ExpectType` to check the actual type:
 *
 * ```ts
 * let obj: { foo: any } = { foo: undefined };
 *
 * hasExactKeys<{ foo: unknown }>()(obj);
 *
 * /// (Tripple forward slash here so dtslint doesn't pick up the example)
 * /// $ExpectType any
 * obj.foo;
 * ```
 */
export function hasExactKeys<T>() {
  return function <U>(value: ValidateStructure<U, T>) { };
}
