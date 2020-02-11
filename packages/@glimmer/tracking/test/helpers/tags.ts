import { bump, Tag, validate } from '@glimmer/validator';

export function assertValidAfterUnrelatedBump(tag: Tag, snapshot: number): void {
  bump();

  QUnit.assert.strictEqual(
    validate(tag, snapshot),
    true,
    'tag is still valid after an unrelated bump'
  );
}
