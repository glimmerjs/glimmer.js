import { Tag, combine } from '@glimmer/validator';
import { CachedReference, Reference, VersionedPathReference } from '@glimmer/reference';
import { Dict, VMArguments, CapturedArguments } from '@glimmer/interfaces';
import { NestedPropertyReference } from '@glimmer/core';

export type HelperOptions = {
  services?: Dict<unknown>;
};

export type UserHelper = (
  args: ReadonlyArray<unknown>,
  named: Dict<unknown>,
  options: HelperOptions
) => unknown;

export default class HelperReference extends CachedReference<unknown>
  implements VersionedPathReference {
  public tag: Tag;
  private args: CapturedArguments;
  private servicesRef?: Reference<Dict<unknown>>;

  constructor(
    private helper: UserHelper,
    args: VMArguments,
    servicesRef?: Reference<Dict<unknown>>
  ) {
    super();
    if (servicesRef) {
      this.tag = combine([args.tag, servicesRef.tag]);
    } else {
      this.tag = args.tag;
    }

    this.args = args.capture();
    this.servicesRef = servicesRef;
  }

  get(key: string): VersionedPathReference {
    return new NestedPropertyReference(this, key);
  }

  compute(): unknown {
    const { helper, args } = this;
    const options: HelperOptions = {};

    if (this.servicesRef) {
      options.services = this.servicesRef.value();
    }

    return helper(args.positional.value(), args.named.value(), options);
  }
}
