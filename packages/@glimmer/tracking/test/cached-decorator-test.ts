/* eslint-disable @typescript-eslint/explicit-function-return-type */
const { test } = QUnit;

import { DEBUG } from '@glimmer/env';
import { tracked, cached } from '@glimmer/tracking';

import * as TSFixtures from './fixtures/typescript';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as BabelFixtures from './fixtures/babel';

QUnit.module('[@glimmer/tracking] @cached Decorators');

test('it works', function (assert) {
  class Person {
    @tracked firstName = 'Jen';
    @tracked lastName = 'Weber';

    @cached
    get fullName() {
      const fullName = `${this.firstName} ${this.lastName}`;
      assert.step(fullName);
      return fullName;
    }
  }

  const person = new Person();
  assert.verifySteps([], 'getter is not called after class initialization');

  assert.strictEqual(person.fullName, 'Jen Weber');
  assert.verifySteps(['Jen Weber'], 'getter was called after property access');

  assert.strictEqual(person.fullName, 'Jen Weber');
  assert.verifySteps([], 'getter was not called again after repeated property access');

  person.firstName = 'Kenneth';
  assert.verifySteps([], 'changing a property does not trigger an eager re-computation');

  assert.strictEqual(person.fullName, 'Kenneth Weber');
  assert.verifySteps(['Kenneth Weber'], 'accessing the property triggers a re-computation');

  assert.strictEqual(person.fullName, 'Kenneth Weber');
  assert.verifySteps([], 'getter was not called again after repeated property access');

  person.lastName = 'Larsen';
  assert.verifySteps([], 'changing a property does not trigger an eager re-computation');

  assert.strictEqual(person.fullName, 'Kenneth Larsen');
  assert.verifySteps(['Kenneth Larsen'], 'accessing the property triggers a re-computation');
});

// https://github.com/ember-polyfills/ember-cached-decorator-polyfill/issues/7
test('it has a separate cache per class instance', function (assert) {
  class Person {
    @tracked firstName: string;
    @tracked lastName: string;

    constructor(firstName: string, lastName: string) {
      this.firstName = firstName;
      this.lastName = lastName;
    }

    @cached
    get fullName() {
      const fullName = `${this.firstName} ${this.lastName}`;
      assert.step(fullName);
      return fullName;
    }
  }

  const jen = new Person('Jen', 'Weber');
  const chris = new Person('Chris', 'Garrett');

  assert.verifySteps([], 'getter is not called after class initialization');

  assert.strictEqual(jen.fullName, 'Jen Weber');
  assert.verifySteps(['Jen Weber'], 'getter was called after property access');

  assert.strictEqual(jen.fullName, 'Jen Weber');
  assert.verifySteps([], 'getter was not called again after repeated property access');

  assert.strictEqual(chris.fullName, 'Chris Garrett', 'other instance has a different value');
  assert.verifySteps(['Chris Garrett'], 'getter was called after property access');

  assert.strictEqual(chris.fullName, 'Chris Garrett');
  assert.verifySteps([], 'getter was not called again after repeated property access');

  chris.lastName = 'Manson';
  assert.verifySteps([], 'changing a property does not trigger an eager re-computation');

  assert.strictEqual(jen.fullName, 'Jen Weber', 'other instance is unaffected');
  assert.verifySteps([], 'getter was not called again after repeated property access');

  assert.strictEqual(chris.fullName, 'Chris Manson');
  assert.verifySteps(['Chris Manson'], 'getter was called after property access');

  assert.strictEqual(jen.fullName, 'Jen Weber', 'other instance is unaffected');
  assert.verifySteps([], 'getter was not called again after repeated property access');
});

[
  ['Babel', BabelFixtures],
  ['TypeScript', TSFixtures],
].forEach(([compiler, F]) => {
  QUnit.module(`[@glimmer/tracking] Cached Property Decorators with ${compiler}`);

  if (DEBUG) {
    test('Cached decorator on a property throws an error', (assert) => {
      assert.throws(F.createClassWithCachedProperty);
    });

    test('Cached decorator with a setter throws an error', (assert) => {
      assert.throws(F.createClassWithCachedSetter);
    });

    test('Cached decorator with arguments throws an error', function (assert) {
      assert.throws(
        F.createClassWithCachedDependentKeys,
        /@cached\('firstName', 'lastName'\)/,
        'the correct error is thrown'
      );
    });

    test('Using @cached as a decorator factory throws an error', function (assert) {
      assert.throws(
        F.createClassWithCachedAsDecoratorFactory,
        /@cached\(\)/,
        'The correct error is thrown'
      );
    });
  }
});
