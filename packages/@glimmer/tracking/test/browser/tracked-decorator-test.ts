const { module, test } = QUnit;

import { DEBUG } from '@glimmer/env';
import { tagForProperty, UntrackedPropertyError } from '@glimmer/tracking';

import * as TSFixtures from './fixtures/typescript';
import * as BabelFixtures from './fixtures/babel';
import { assertValidAfterUnrelatedBump } from './helpers/tags';

[['Babel', BabelFixtures], ['TypeScript', TSFixtures]].forEach(([compiler, F]) => {
  module(`[@glimmer/tracking] Tracked Property Decorators with ${compiler}`);

  test('tracked properties can be read and written to', assert => {
    let obj = new F.Tom();
    assert.strictEqual(obj.firstName, 'Tom');
    obj.firstName = 'Edsger';
    assert.strictEqual(obj.firstName, 'Edsger');
  });

  test('can request a tag for a property', assert => {
    let obj = new F.Tom();
    assert.strictEqual(obj.firstName, 'Tom');

    let tag = tagForProperty(obj, 'firstName');
    let snapshot = tag.value();
    assert.ok(tag.validate(snapshot), 'tag should be valid to start');

    obj.firstName = 'Edsger';
    assert.strictEqual(tag.validate(snapshot), false, 'tag is invalidated after property is set');
    snapshot = tag.value();
    assert.strictEqual(tag.validate(snapshot), true, 'tag is valid on the second check');

    assertValidAfterUnrelatedBump(tag, snapshot);
  });

  test('can request a tag from a frozen class instance', assert => {
    let obj = Object.freeze(new F.Toran());
    assert.strictEqual(obj.firstName, 'Toran');
    assert.strictEqual(obj.lastName, 'Billups');

    // Explicitly annotated tracked properties
    let tag = tagForProperty(obj, 'firstName');
    let snapshot = tag.value();
    assert.ok(tag.validate(snapshot), 'tag should be valid to start');
    snapshot = tag.value();
    assert.strictEqual(tag.validate(snapshot), true, 'tag is still valid');

    // Non-tracked data properties
    tag = tagForProperty(obj, 'lastName');
    snapshot = tag.value();
    assert.ok(tag.validate(snapshot), 'tag should be valid to start');
    snapshot = tag.value();
    assert.strictEqual(tag.validate(snapshot), true, 'tag is still valid');

    assertValidAfterUnrelatedBump(tag, snapshot);
  });

  test('can request a tag from an instance of a frozen class', assert => {
    let obj = Object.freeze(new F.FrozenToran());

    assert.strictEqual(obj.firstName, 'Toran');

    let tag = tagForProperty(obj, 'firstName');
    let snapshot = tag.value();
    assert.ok(tag.validate(snapshot), 'tag should be valid to start');
    snapshot = tag.value();
    assert.strictEqual(tag.validate(snapshot), true, 'tag is still valid');

    assertValidAfterUnrelatedBump(tag, snapshot);
  });

  test('can track a computed property', assert => {
    let obj = new F.PersonWithCount();
    assert.strictEqual(obj.firstName, 'Tom0');
    assert.strictEqual(obj.firstName, 'Tom1');

    let tag = tagForProperty(obj, 'firstName');
    let snapshot = tag.value();
    assert.ok(tag.validate(snapshot), 'tag should be valid to start');

    assert.strictEqual(obj.firstName, 'Tom2');
    assert.ok(tag.validate(snapshot), 'reading from property does not invalidate the tag');

    obj.firstName = 'Edsger';
    assert.strictEqual(tag.validate(snapshot), false, 'tag is invalidated after property is set');
    snapshot = tag.value();

    assertValidAfterUnrelatedBump(tag, snapshot);

    assert.strictEqual(obj.firstName, 'Edsger3');
    assert.strictEqual(
      tag.validate(snapshot),
      false,
      'tag is invalid, since reading always recomputes the tags'
    );
    snapshot = tag.value();

    assertValidAfterUnrelatedBump(tag, snapshot);
  });

  test('tracked computed properties are invalidated when their dependencies are invalidated', assert => {
    let obj = new F.PersonWithSalutation();
    assert.strictEqual(obj.salutation, 'Hello, Tom Dale!', `the saluation field is valid`);
    assert.strictEqual(obj.fullName, 'Tom Dale', `the fullName field is valid`);

    let tag = tagForProperty(obj, 'salutation');
    let snapshot = tag.value();
    assert.ok(tag.validate(snapshot), 'tag should be valid to start');

    obj.firstName = 'Edsger';
    obj.lastName = 'Dijkstra';
    assert.strictEqual(
      tag.validate(snapshot),
      false,
      'tag is invalidated after chained dependency is set'
    );
    assert.strictEqual(obj.fullName, 'Edsger Dijkstra');
    assert.strictEqual(obj.salutation, 'Hello, Edsger Dijkstra!');

    snapshot = tag.value();
    assert.strictEqual(tag.validate(snapshot), true);

    obj.fullName = 'Alan Kay';
    assert.strictEqual(
      tag.validate(snapshot),
      false,
      'tag is invalidated after chained dependency is set'
    );
    assert.strictEqual(obj.fullName, 'Alan Kay');
    assert.strictEqual(obj.firstName, 'Alan');
    assert.strictEqual(obj.lastName, 'Kay');
    assert.strictEqual(obj.salutation, 'Hello, Alan Kay!');

    snapshot = tag.value();
    assert.strictEqual(tag.validate(snapshot), true);

    assertValidAfterUnrelatedBump(tag, snapshot);
  });

  test('nested @tracked in multiple objects', assert => {
    let obj = new F.Contact(new F.PersonForContact(), 'tom@example.com');
    assert.strictEqual(obj.contact, 'Tom Dale @ tom@example.com', `the contact field is valid`);
    assert.strictEqual(obj.person.fullName, 'Tom Dale', `the fullName field is valid`);
    let person = obj.person;

    let tag = tagForProperty(obj, 'contact');
    let snapshot = tag.value();
    assert.ok(tag.validate(snapshot), 'tag should be valid to start');

    person.firstName = 'Edsger';
    person.lastName = 'Dijkstra';
    assert.strictEqual(
      tag.validate(snapshot),
      false,
      'tag is invalidated after nested dependency is set'
    );
    assert.strictEqual(person.fullName, 'Edsger Dijkstra');
    assert.strictEqual(obj.contact, 'Edsger Dijkstra @ tom@example.com');

    snapshot = tag.value();
    assert.strictEqual(tag.validate(snapshot), true);

    person.fullName = 'Alan Kay';
    assert.strictEqual(
      tag.validate(snapshot),
      false,
      'tag is invalidated after chained dependency is set'
    );
    assert.strictEqual(person.fullName, 'Alan Kay');
    assert.strictEqual(person.firstName, 'Alan');
    assert.strictEqual(person.lastName, 'Kay');
    assert.strictEqual(obj.contact, 'Alan Kay @ tom@example.com');

    snapshot = tag.value();
    assert.strictEqual(tag.validate(snapshot), true);

    obj.email = 'alan@example.com';
    assert.strictEqual(
      tag.validate(snapshot),
      false,
      'tag is invalidated after chained dependency is set'
    );
    assert.strictEqual(person.fullName, 'Alan Kay');
    assert.strictEqual(person.firstName, 'Alan');
    assert.strictEqual(person.lastName, 'Kay');
    assert.strictEqual(obj.contact, 'Alan Kay @ alan@example.com');

    snapshot = tag.value();
    assert.strictEqual(tag.validate(snapshot), true);

    assertValidAfterUnrelatedBump(tag, snapshot);
  });

  if (DEBUG) {
    test('Arguments in tracked decorator throws an error', function(assert) {
      assert.throws(
        F.createClassWithTrackedDependentKeys,
        /@tracked\('firstName', 'lastName'\)/,
        'the correct error is thrown'
      );
    });

    test('Using @tracked as a decorator factory throws an error', function(assert) {
      assert.throws(F.createClassWithTrackedAsDecoratorFactory, /@tracked\(\)/, 'The correct error is thrown');
    });
  }
});

module('[@glimmer/component] Tracked Property Warning in Development Mode');

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
