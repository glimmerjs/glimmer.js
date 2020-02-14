import { Tag } from '@glimmer/validator';
import { CachedReference, VersionedPathReference, PropertyReference, TemplateReferenceEnvironment } from '@glimmer/reference';
import { Dict, VMArguments, CapturedArguments } from '@glimmer/interfaces';

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
    private env: TemplateReferenceEnvironment
  ) {
    super();
    this.tag = args.tag;

    this.args = args.capture();
  }

  get(key: string): VersionedPathReference {
    return new PropertyReference(this, key, this.env);
  }

  compute(): unknown {
    const { helper, args } = this;

    return helper(args.positional.value(), args.named.value());
  }
}
