import * as tracking from '@glimmer/tracking';
import { hasExactKeys } from './utils';

hasExactKeys<{
  tracked: unknown;
  cached: unknown;
}>()(tracking);

// $ExpectType PropertyDecorator
tracking.tracked;
// $ExpectType PropertyDecorator
tracking.cached;
