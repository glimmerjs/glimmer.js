/* tslint:disable:no-unused-expression */
const { module, test } = QUnit;

import { DEBUG } from '@glimmer/env';
import { track, valueForTag, validateTag } from '@glimmer/validator';

import * as TSFixtures from './fixtures/typescript';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import * as BabelFixtures from './fixtures/babel';
import { assertValidAfterUnrelatedBump } from './helpers/tags';

[
  ['Babel', BabelFixtures],
  ['TypeScript', TSFixtures],
].forEach(([compiler, F]) => {
  module(`[@glimmer/tracking] Tracked Property Decorators with ${compiler}`);

  test('tracked properties can be read and written to', (assert) => {
    const obj = new F.Tom();
    assert.strictEqual(obj.firstName, 'Tom');
    obj.firstName = 'Edsger';
    assert.strictEqual(obj.firstName, 'Edsger');
  });

  test('can request a tag for a property', (assert) => {
    const obj = new F.Tom();
    assert.strictEqual(obj.firstName, 'Tom');

    const tag = track(() => {
      obj.firstName;
    });
    let snapshot = valueForTag(tag);
    assert.ok(validateTag(tag, snapshot), 'tag should be valid to start');

    obj.firstName = 'Edsger';
    assert.strictEqual(
      validateTag(tag, snapshot),
      false,
      'tag is invalidated after property is set'
    );
    snapshot = valueForTag(tag);
    assert.strictEqual(validateTag(tag, snapshot), true, 'tag is valid on the second check');

    assertValidAfterUnrelatedBump(tag, snapshot);
  });

  test('can request a tag from a frozen class instance', (assert) => {
    const obj = Object.freeze(new F.Toran());
    assert.strictEqual(obj.firstName, 'Toran');
    assert.strictEqual(obj.lastName, 'Billups');

    // Explicitly annotated tracked properties
    let tag = track(() => {
      obj.firstName;
    });
    let snapshot = valueForTag(tag);
    assert.ok(validateTag(tag, snapshot), 'tag should be valid to start');
    snapshot = valueForTag(tag);
    assert.strictEqual(validateTag(tag, snapshot), true, 'tag is still valid');

    // Non-tracked data properties
    tag = track(() => {
      obj.lastName;
    });
    snapshot = valueForTag(tag);
    assert.ok(validateTag(tag, snapshot), 'tag should be valid to start');
    snapshot = valueForTag(tag);
    assert.strictEqual(validateTag(tag, snapshot), true, 'tag is still valid');

    assertValidAfterUnrelatedBump(tag, snapshot);
  });

  test('can request a tag from an instance of a frozen class', (assert) => {
    const obj = Object.freeze(new F.FrozenToran());

    assert.strictEqual(obj.firstName, 'Toran');

    const tag = track(() => {
      obj.firstName;
    });
    let snapshot = valueForTag(tag);
    assert.ok(validateTag(tag, snapshot), 'tag should be valid to start');
    snapshot = valueForTag(tag);
    assert.strictEqual(validateTag(tag, snapshot), true, 'tag is still valid');

    assertValidAfterUnrelatedBump(tag, snapshot);
  });

  test('can track a getter', (assert) => {
    const obj = new F.PersonWithCount();
    assert.strictEqual(obj.firstName, 'Tom0');
    assert.strictEqual(obj.firstName, 'Tom1');

    const tag = track(() => {
      obj.firstName;
    });
    let snapshot = valueForTag(tag);
    assert.ok(validateTag(tag, snapshot), 'tag should be valid to start');

    assert.strictEqual(obj.firstName, 'Tom3');
    assert.ok(validateTag(tag, snapshot), 'reading from property does not invalidate the tag');

    obj.firstName = 'Edsger';
    assert.strictEqual(
      validateTag(tag, snapshot),
      false,
      'tag is invalidated after property is set'
    );
    snapshot = valueForTag(tag);

    assertValidAfterUnrelatedBump(tag, snapshot);
  });

  test('getters are invalidated when their dependencies are invalidated', (assert) => {
    const obj = new F.PersonWithSalutation();
    assert.strictEqual(obj.salutation, 'Hello, Tom Dale!', `the saluation field is valid`);
    assert.strictEqual(obj.fullName, 'Tom Dale', `the fullName field is valid`);

    const tag = track(() => {
      obj.salutation;
    });
    let snapshot = valueForTag(tag);
    assert.ok(validateTag(tag, snapshot), 'tag should be valid to start');

    obj.firstName = 'Edsger';
    obj.lastName = 'Dijkstra';
    assert.strictEqual(
      validateTag(tag, snapshot),
      false,
      'tag is invalidated after chained dependency is set'
    );
    assert.strictEqual(obj.fullName, 'Edsger Dijkstra');
    assert.strictEqual(obj.salutation, 'Hello, Edsger Dijkstra!');

    snapshot = valueForTag(tag);
    assert.strictEqual(validateTag(tag, snapshot), true);

    obj.fullName = 'Alan Kay';
    assert.strictEqual(
      validateTag(tag, snapshot),
      false,
      'tag is invalidated after chained dependency is set'
    );
    assert.strictEqual(obj.fullName, 'Alan Kay');
    assert.strictEqual(obj.firstName, 'Alan');
    assert.strictEqual(obj.lastName, 'Kay');
    assert.strictEqual(obj.salutation, 'Hello, Alan Kay!');

    snapshot = valueForTag(tag);
    assert.strictEqual(validateTag(tag, snapshot), true);

    assertValidAfterUnrelatedBump(tag, snapshot);
  });

  test('nested @tracked in multiple objects', (assert) => {
    const obj = new F.Contact(new F.PersonForContact(), 'tom@example.com');
    assert.strictEqual(obj.contact, 'Tom Dale @ tom@example.com', `the contact field is valid`);
    assert.strictEqual(obj.person.fullName, 'Tom Dale', `the fullName field is valid`);
    const person = obj.person;

    const tag = track(() => {
      obj.contact;
    });
    let snapshot = valueForTag(tag);
    assert.ok(validateTag(tag, snapshot), 'tag should be valid to start');

    person.firstName = 'Edsger';
    person.lastName = 'Dijkstra';
    assert.strictEqual(
      validateTag(tag, snapshot),
      false,
      'tag is invalidated after nested dependency is set'
    );
    assert.strictEqual(person.fullName, 'Edsger Dijkstra');
    assert.strictEqual(obj.contact, 'Edsger Dijkstra @ tom@example.com');

    snapshot = valueForTag(tag);
    assert.strictEqual(validateTag(tag, snapshot), true);

    person.fullName = 'Alan Kay';
    assert.strictEqual(
      validateTag(tag, snapshot),
      false,
      'tag is invalidated after chained dependency is set'
    );
    assert.strictEqual(person.fullName, 'Alan Kay');
    assert.strictEqual(person.firstName, 'Alan');
    assert.strictEqual(person.lastName, 'Kay');
    assert.strictEqual(obj.contact, 'Alan Kay @ tom@example.com');

    snapshot = valueForTag(tag);
    assert.strictEqual(validateTag(tag, snapshot), true);

    obj.email = 'alan@example.com';
    assert.strictEqual(
      validateTag(tag, snapshot),
      false,
      'tag is invalidated after chained dependency is set'
    );
    assert.strictEqual(person.fullName, 'Alan Kay');
    assert.strictEqual(person.firstName, 'Alan');
    assert.strictEqual(person.lastName, 'Kay');
    assert.strictEqual(obj.contact, 'Alan Kay @ alan@example.com');

    snapshot = valueForTag(tag);
    assert.strictEqual(validateTag(tag, snapshot), true);

    assertValidAfterUnrelatedBump(tag, snapshot);
  });

  if (DEBUG) {
    test('Tracked decorator with a getter throws an error', (assert) => {
      assert.throws(F.createClassWithTrackedGetter);
    });

    test('Tracked decorator with a setter throws an error', (assert) => {
      assert.throws(F.createClassWithTrackedSetter);
    });

    test('Tracked decorator with arguments throws an error', function (assert) {
      assert.throws(
        F.createClassWithTrackedDependentKeys,
        /@tracked\('firstName', 'lastName'\)/,
        'the correct error is thrown'
      );
    });

    test('Using @tracked as a decorator factory throws an error', function (assert) {
      assert.throws(
        F.createClassWithTrackedAsDecoratorFactory,
        /@tracked\(\)/,
        'The correct error is thrown'
      );
    });
  }
});
