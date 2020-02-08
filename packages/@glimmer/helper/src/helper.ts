import { Helper as GlimmerHelper } from '@glimmer/interfaces';
import HelperReference, { UserHelper } from './reference';

export function helper(helperFn: UserHelper): GlimmerHelper {
  return (args, _vm): HelperReference => {
    return new HelperReference(helperFn, args);
  };
}
