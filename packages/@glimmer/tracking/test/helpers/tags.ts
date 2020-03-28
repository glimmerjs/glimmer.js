import { bump, Tag, validateTag } from '@glimmer/validator';

export function assertValidAfterUnrelatedBump(tag: Tag, snapshot: number): void {
  bump();

  QUnit.assert.strictEqual(
    validateTag(tag, snapshot),
    true,
    'tag is still valid after an unrelated bump'
  );
}
