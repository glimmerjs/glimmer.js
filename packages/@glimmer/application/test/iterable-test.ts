import { Iterable } from '../src/index';

const { module, test } = QUnit;

module('Iterable');

test('basic iteration of an array of primitives', function(assert) {
  let ref = {
    tag: {} as any,
    value() {
      return ['foo', 'bar'];
    }
  };
  let keyFor = (_, i) => i;
  let iterable = new Iterable(ref, keyFor);
  let iterator = iterable.iterate();

  assert.deepEqual(iterator.next(), {
    key: 0,
    value: 'foo',
    memo: 0
  });
  assert.deepEqual(iterator.next(), {
    key: 1,
    value: 'bar',
    memo: 1
  });
});
