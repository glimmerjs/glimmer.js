import { VMArguments } from '@glimmer/interfaces';
import { createComputeRef, valueForRef, Reference } from '@glimmer/reference';
import { DEBUG } from '@glimmer/env';
import { toBool } from '@glimmer/global-context';

export function ifHelper(args: VMArguments): Reference {
  const positional = args.positional.capture();

  return createComputeRef(
    () => {
      if ((DEBUG && positional.length < 2) || positional.length > 3) {
        throw new Error(
          'The inline form of the `if` helper expects two or three arguments, e.g. `{{if trialExpired "Expired" expiryDate}}`.'
        );
      }

      const [condition, truthyValue, falsyValue] = positional;

      if (toBool(valueForRef(condition)) === true) {
        return valueForRef(truthyValue);
      } else {
        return falsyValue !== undefined ? valueForRef(falsyValue) : undefined;
      }
    },
    null,
    'if'
  );
}
