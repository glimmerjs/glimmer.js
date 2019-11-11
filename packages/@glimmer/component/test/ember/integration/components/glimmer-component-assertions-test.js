import GlimmerComponent from '@glimmer/component';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, setupOnerror } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

import { gte } from 'ember-compatibility-helpers';

const GLIMMERJS_ONLY_FIELDS = [
  'bounds',
  'element',
  'debugName',
];

const GLIMMERJS_ONLY_METHODS = [
  'didInsertElement',
  'didUpdate',
];

module('Integration | Component | @glimmer/component', function(hooks) {

  setupRenderingTest(hooks);

  for (let element of GLIMMERJS_ONLY_FIELDS) {
    test(`throws an error when attempting to use ${element}`, async function(assert) {
      assert.expect(1);

      setupOnerror((err) => assert.ok(err.message.includes(element), err.message));

      class TestComponent extends GlimmerComponent {
        constructor() {
          super(...arguments);

          // access the element
          this[element];
        }
      }

      this.owner.register('component:under-test', TestComponent);

      await render(hbs`{{under-test}}`);
    });

    test(`throws an error when attempting to use ${element}`, async function(assert) {
      assert.expect(0);

      setupOnerror((err) => assert.ok(false, `expected no error, but got ${err}`));

      class TestComponent extends GlimmerComponent {
        [element] = 123;

        constructor() {
          super(...arguments);

          // access the element
          this[element];
        }
      }

      this.owner.register('component:under-test', TestComponent);

      await render(hbs`{{under-test}}`);
    });
  }

  for (let element of GLIMMERJS_ONLY_METHODS) {
    test(`throws an error when attempting to define ${element}`, async function(assert) {
      assert.expect(1);

      setupOnerror((err) => assert.ok(err.message.includes(element), err.message));

      class TestComponent extends GlimmerComponent {
        [element]() {}
      }

      this.owner.register('component:under-test', TestComponent);

      await render(hbs`{{under-test}}`);
    });
  }
});
