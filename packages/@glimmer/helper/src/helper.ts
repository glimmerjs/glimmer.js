import { Helper as GlimmerHelper } from '@glimmer/interfaces';
import HelperReference, { UserHelper } from './reference';

export function helper(helperFn: UserHelper): GlimmerHelper {
  return (args, vm): HelperReference => {
    return new HelperReference(helperFn, args, vm.env);
  };
}
