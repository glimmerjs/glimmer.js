import * as tracking from '@glimmer/tracking';
import { hasExactKeys } from './utils';

hasExactKeys<{
  setPropertyDidChange: unknown;
  tracked: unknown;
}>()(tracking);

// $ExpectType (cb: () => void) => void
tracking.setPropertyDidChange;

// $ExpectType PropertyDecorator
tracking.tracked;
