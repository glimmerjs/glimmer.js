import * as tracking from '@glimmer/tracking';
import { hasExactKeys } from './utils';

hasExactKeys<{
  tracked: unknown;
}>()(tracking);

// $ExpectType PropertyDecorator
tracking.tracked;
