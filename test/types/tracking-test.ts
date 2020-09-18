import * as tracking from '@glimmer/tracking';
import * as cachePrimitives from '@glimmer/tracking/primitives/cache';
import { hasExactKeys } from './utils';

hasExactKeys<{
  tracked: unknown;
}>()(tracking);

// $ExpectType PropertyDecorator
tracking.tracked;

hasExactKeys<{
  createCache: unknown;
  getValue: unknown;
  isConst: unknown;
}>()(cachePrimitives);
