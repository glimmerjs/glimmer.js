import { setPropertyDidChange, tracked } from '@glimmer/tracking';
import { expectTypeOf } from 'expect-type';

expectTypeOf(setPropertyDidChange).toEqualTypeOf<(cb: () => void) => void>();
expectTypeOf(tracked).toEqualTypeOf<PropertyDecorator>();
