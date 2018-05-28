import {
  Dict,
  Opaque
} from '@glimmer/util';

import {
  TagWrapper,
  RevisionTag
} from "@glimmer/reference";

import {
  Arguments,
  CapturedArguments,
  Helper as GlimmerHelper,
  VM
} from "@glimmer/runtime";

import {
  CachedReference
} from '@glimmer/component';

export type UserHelper = (args: ReadonlyArray<Opaque>, named: Dict<Opaque>) => any;

export default function buildUserHelper(helperFunc): GlimmerHelper {
  return (_vm: VM, args: Arguments) => new HelperReference(helperFunc, args);
}

export class HelperReference extends CachedReference<Opaque> {
  public tag: TagWrapper<RevisionTag>;
  private args: CapturedArguments;

  constructor(private helper: UserHelper, args: Arguments) {
    super();

    this.tag = args.tag;
    this.args = args.capture();
  }

  compute() {
    let { helper, args } = this;

    return helper(args.positional.value(), args.named.value());
  }
}
