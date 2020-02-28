import { VMArguments, VM } from '@glimmer/interfaces';
import { HelperRootReference } from '@glimmer/reference';
import { DEBUG } from '@glimmer/env';
import toBool from '../environment/to-bool';

export function ifHelper(args: VMArguments, vm: VM): HelperRootReference {
  return new HelperRootReference(
    ({ positional }) => {
      if (DEBUG && positional.length < 2 || positional.length > 3) {
        throw new Error('The inline form of the `if` helper expects two or three arguments, e.g. `{{if trialExpired "Expired" expiryDate}}`.');
      }

      const condition = positional.at(0);
      const truthyValue = positional.at(1);
      const falsyValue = positional.at(2);

      if (toBool(condition.value()) === true) {
        return truthyValue.value();
      } else {
        return falsyValue !== undefined ? falsyValue.value() : undefined;
      }
    },
    args.capture(),
    vm.env,
    'if'
  )
}
