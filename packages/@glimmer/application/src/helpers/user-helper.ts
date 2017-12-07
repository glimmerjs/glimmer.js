import {
  Dict,
  Opaque
} from '@glimmer/util';

import {
  PathReference,
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
  RootReference
} from '@glimmer/component';

export type UserHelper = (args: ReadonlyArray<Opaque>, named: Dict<Opaque>) => any;

export default function buildUserHelper(helperFunc): GlimmerHelper {
  return (_vm: VM, args: Arguments) => new HelperReference(helperFunc, args);
}

export class HelperReference implements PathReference<Opaque> {
  private helper: UserHelper;
  private args: CapturedArguments;
  public tag: TagWrapper<RevisionTag>;

  constructor(helper: UserHelper, args: Arguments) {
    this.helper = helper;
    this.tag = args.tag;
    this.args = args.capture();
  }

  value() {
    let { helper, args } = this;

    return helper(args.positional.value(), args.named.value());
  }

  get(): RootReference {
    return new RootReference(this);
  }
}
