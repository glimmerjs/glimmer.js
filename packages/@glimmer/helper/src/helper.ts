import { Helper as GlimmerHelper, Dict } from '@glimmer/interfaces';
import HelperReference, { UserHelper } from './reference';
import { Reference } from '@glimmer/reference';
import { PUBLIC_DYNAMIC_SCOPE_KEY } from '@glimmer/core';

export function helper(helperFn: UserHelper): GlimmerHelper {
  return (args, vm) => {
    const dynamicScope = vm.dynamicScope();
    let services;

    if (dynamicScope) {
      services = dynamicScope.get(PUBLIC_DYNAMIC_SCOPE_KEY) as Reference<Dict<unknown>>;
    }

    return new HelperReference(helperFn, args, services);
  };
}
