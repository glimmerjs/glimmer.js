import { Helper as GlimmerHelper, Dict } from '@glimmer/interfaces';
import HelperReference, { UserHelper } from './reference';
import { Reference } from '@glimmer/reference';
import { HOST_META_KEY } from '@glimmer/core';

export function helper(helperFn: UserHelper): GlimmerHelper {
  return (args, vm): HelperReference => {
    const dynamicScope = vm.dynamicScope();
    let services;

    if (dynamicScope) {
      services = dynamicScope.get(HOST_META_KEY) as Reference<Dict<unknown>>;
    }

    return new HelperReference(helperFn, args, services);
  };
}
