const { module, test } = QUnit;

import { DEBUG } from '@glimmer/env';
import { tagForProperty, UntrackedPropertyError } from '@glimmer/tracking';
import { CONSTANT_TAG } from '@glimmer/reference';
import { assertValidAfterUnrelatedBump } from './helpers/tags';

module('[@glimmer/tracking] Tracked Property Warning in Development Mode');

if (DEBUG) {
  test('requesting a tag for an untracked property should throw an exception if mutated in development mode', assert => {
    assert.expect(2);

    class UntrackedPerson {
      firstName = 'Tom';
      get lastName() {
        return 'Dale';
      }
      set lastName(value) {}

      toString() {
        return 'UntrackedPerson';
      }
    }

    let obj = new UntrackedPerson();
    tagForProperty(obj, 'firstName');
    tagForProperty(obj, 'lastName');

    assert.throws(() => {
      obj.firstName = 'Ricardo';
    }, /The property 'firstName' on UntrackedPerson was changed after being rendered. If you want to change a property used in a template after the component has rendered, mark the property as a tracked property with the @tracked decorator./);

    assert.throws(() => {
      obj.lastName = 'Mendes';
    }, /The property 'lastName' on UntrackedPerson was changed after being rendered. If you want to change a property used in a template after the component has rendered, mark the property as a tracked property with the @tracked decorator./);
  });
} else {
  test('requesting a tag for an untracked property should not throw an exception if mutated in production mode', assert => {
    assert.expect(1);

    class UntrackedPerson {
      firstName = 'Tom';
      get lastName() {
        return 'Dale';
      }
      set lastName(value) {}

      toString() {
        return 'UntrackedPerson';
      }
    }

    let obj = new UntrackedPerson();
    tagForProperty(obj, 'firstName');
    tagForProperty(obj, 'lastName');

    obj.firstName = 'Ricardo';
    obj.lastName = 'Mendes';

    assert.ok(true, 'did not throw an exception after mutating tracked properties');
  });
}

if (DEBUG) {
  test('interceptor works correctly for own value descriptor', assert => {
    let obj = { name: 'Martin' };

    tagForProperty(obj, 'name');

    assert.strictEqual(obj.name, 'Martin');

    assert.throws(() => {
      obj.name = 'Tom';
    }, UntrackedPropertyError.for(obj, 'name'));
  });

  test('interceptor works correctly for inherited value descriptor', assert => {
    class Person {
      name: string;
    }
    Person.prototype.name = 'Martin';

    let obj = new Person();

    tagForProperty(obj, 'name');

    assert.strictEqual(obj.name, 'Martin');

    assert.throws(() => {
      obj.name = 'Tom';
    }, UntrackedPropertyError.for(obj, 'name'));
  });

  test('interceptor works correctly for own getter descriptor', assert => {
    let obj = {
      get name() {
        return 'Martin';
      },
    };

    tagForProperty(obj, 'name');

    assert.strictEqual(obj.name, 'Martin');

    assert.throws(() => {
      (obj as any).name = 'Tom';
    }, UntrackedPropertyError.for(obj, 'name'));
  });

  test('interceptor works correctly for inherited getter descriptor', assert => {
    class Person {
      get name() {
        return 'Martin';
      }
    }

    let obj = new Person();

    tagForProperty(obj, 'name');

    assert.strictEqual(obj.name, 'Martin');

    assert.throws(() => {
      (obj as any).name = 'Tom';
    }, UntrackedPropertyError.for(obj, 'name'));
  });

  test('interceptor works correctly for inherited non-configurable descriptor', assert => {
    class Person {
      name: string;
    }
    Person.prototype.name = 'Martin';
    Object.defineProperty(Person.prototype, 'name', { configurable: false });

    let obj = new Person();

    tagForProperty(obj, 'name');

    assert.strictEqual(obj.name, 'Martin');

    assert.throws(() => {
      obj.name = 'Tom';
    }, UntrackedPropertyError.for(obj, 'name'));
  });
}

test('interceptor is not installed for own non-configurable descriptor', assert => {
  let obj = { name: 'Martin' };
  Object.defineProperty(obj, 'name', { configurable: false });

  tagForProperty(obj, 'name');

  assert.strictEqual(obj.name, 'Martin');

  obj.name = 'Tom';

  assert.strictEqual(obj.name, 'Tom');
});

test('interceptor is not installed for array length [issue #34]', assert => {
  let array = [1, 2, 3];

  tagForProperty(array, 'length');

  assert.strictEqual(array.length, 3);

  array.push(4);

  assert.strictEqual(array.length, 4);
});

test('can request a tag for non-objects and get a CONSTANT_TAG', assert => {
  let snapshot = CONSTANT_TAG.value();

  assert.ok(tagForProperty(null, 'foo').validate(snapshot));
  assert.ok(tagForProperty(undefined, 'foo').validate(snapshot));
  assert.ok(tagForProperty(12345, 'foo').validate(snapshot));
  assert.ok(tagForProperty(0, 'foo').validate(snapshot));
  assert.ok(tagForProperty(true, 'foo').validate(snapshot));
  assert.ok(tagForProperty(false, 'foo').validate(snapshot));
  assert.ok(tagForProperty(Symbol(), 'foo').validate(snapshot));
  assert.ok(tagForProperty('hello world', 'foo').validate(snapshot));
});

test('can request a tag from a frozen POJO', assert => {
  let obj = Object.freeze({
    firstName: 'Toran',
  });

  assert.strictEqual(obj.firstName, 'Toran');

  let tag = tagForProperty(obj, 'firstName');
  let snapshot = tag.value();
  assert.ok(tag.validate(snapshot), 'tag should be valid to start');
  snapshot = tag.value();
  assert.strictEqual(tag.validate(snapshot), true, 'tag is still valid');

  assertValidAfterUnrelatedBump(tag, snapshot);
});
