import { bump, Tag, validate } from '@glimmer/reference';

export function assertValidAfterUnrelatedBump(tag: Tag, snapshot: number) {
  bump();

  QUnit.assert.strictEqual(
    validate(tag, snapshot),
    true,
    'tag is still valid after an unrelated bump'
  );
}