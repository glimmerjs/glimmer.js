const { module, test } = QUnit;

import { DEBUG } from '@glimmer/env';
import { trackProperty, UntrackedPropertyError } from '@glimmer/tracking';

module('[@glimmer/tracking] Tracked Property Warning in Development Mode');

if (DEBUG) {
  test('tracking an untracked property should throw an exception if mutated in development mode', assert => {
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
    trackProperty(obj, 'firstName');

    assert.throws(() => {
      obj.firstName = 'Ricardo';
    }, /The property 'firstName' on UntrackedPerson was changed after being rendered. If you want to change a property used in a template after the component has rendered, mark the property as a tracked property with the @tracked decorator./);
  });
} else {
  test('tracking an untracked property should not throw an exception if mutated in production mode', assert => {
    assert.expect(1);

    class UntrackedPerson {
      firstName = 'Tom';

      toString() {
        return 'UntrackedPerson';
      }
    }

    let obj = new UntrackedPerson();
    trackProperty(obj, 'firstName');

    obj.firstName = 'Ricardo';

    assert.ok(true, 'did not throw an exception after mutating tracked properties');
  });
}

if (DEBUG) {
  test('interceptor works correctly for own value descriptor', assert => {
    let obj = { name: 'Martin' };

    trackProperty(obj, 'name');

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

    trackProperty(obj, 'name');

    assert.strictEqual(obj.name, 'Martin');

    assert.throws(() => {
      obj.name = 'Tom';
    }, UntrackedPropertyError.for(obj, 'name'));
  });

  test('interceptor works correctly for inherited non-configurable descriptor', assert => {
    class Person {
      name: string;
    }
    Person.prototype.name = 'Martin';
    Object.defineProperty(Person.prototype, 'name', { configurable: false });

    let obj = new Person();

    trackProperty(obj, 'name');

    assert.strictEqual(obj.name, 'Martin');

    assert.throws(() => {
      obj.name = 'Tom';
    }, UntrackedPropertyError.for(obj, 'name'));
  });
}

test('interceptor is not installed for getter descriptor', assert => {
  let obj = {
    _name: 'Martin',
    get name() {
      return this._name;
    },
    set name(value) {
      this._name = value;
    }
  };

  trackProperty(obj, 'name');
  assert.strictEqual(obj.name, 'Martin');

  obj.name = 'Tom';
  assert.strictEqual(obj.name, 'Tom');
});

test('interceptor is not installed for inherited getter descriptor', assert => {
  class Person {
    _name = 'Martin';

    get name() {
      return this._name;
    }

    set name(value) {
      this._name = value;
    }
  }

  let obj = new Person();

  trackProperty(obj, 'name');
  assert.strictEqual(obj.name, 'Martin');

  obj.name = 'Tom';
  assert.strictEqual(obj.name, 'Tom');
});

test('interceptor is not installed for own non-configurable descriptor', assert => {
  let obj = { name: 'Martin' };
  Object.defineProperty(obj, 'name', { configurable: false });

  trackProperty(obj, 'name');
  assert.strictEqual(obj.name, 'Martin');
  obj.name = 'Tom';
  assert.strictEqual(obj.name, 'Tom');
});

test('interceptor is not installed for array length [issue #34]', assert => {
  let array = [1, 2, 3];

  trackProperty(array, 'length');

  assert.strictEqual(array.length, 3);

  array.push(4);

  assert.strictEqual(array.length, 4);
});

test('interceptor is not installed on a frozen object', assert => {
  assert.expect(2);

  let obj = Object.freeze({
    firstName: 'Toran',
  });

  assert.strictEqual(obj.firstName, 'Toran');
  trackProperty(obj, 'firstName');
  assert.strictEqual(obj.firstName, 'Toran');
});
