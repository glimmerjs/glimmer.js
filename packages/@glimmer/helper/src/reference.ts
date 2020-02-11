import { Tag } from '@glimmer/validator';
import { CachedReference, VersionedPathReference } from '@glimmer/reference';
import { Dict, VMArguments, CapturedArguments } from '@glimmer/interfaces';
import { NestedPropertyReference } from '@glimmer/core';

export type UserHelper = (
  args: ReadonlyArray<unknown>,
  named: Dict<unknown>
) => unknown;

export default class HelperReference extends CachedReference<unknown>
  implements VersionedPathReference {
  public tag: Tag;
  private args: CapturedArguments;

  constructor(
    private helper: UserHelper,
    args: VMArguments,
  ) {
    super();
    this.tag = args.tag;

    this.args = args.capture();
  }

  get(key: string): VersionedPathReference {
    return new NestedPropertyReference(this, key);
  }

  compute(): unknown {
    const { helper, args } = this;

    return helper(args.positional.value(), args.named.value());
  }
}
