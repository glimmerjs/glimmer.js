import { bump, Tag } from '@glimmer/reference';

export function assertValidAfterUnrelatedBump(tag: Tag, snapshot: number) {
  bump();

  QUnit.assert.strictEqual(
    tag.validate(snapshot),
    true,
    'tag is still valid after an unrelated bump'
  );
}