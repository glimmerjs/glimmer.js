import Component from '@glimmer/component';
import { buildApp } from '@glimmer/application-test-helpers';

const { module, test } = QUnit;

module('[@glimmer/component] Component Elements');

test('fragments are supported', async function(assert) {
  assert.expect(2);

  class Fragment extends Component {
    showUser = true;

    didInsertElement() {
      let firstNode = this.bounds.firstNode as HTMLElement;
      let lastNode = this.bounds.lastNode as Text;

      assert.equal(firstNode.tagName, 'H1');
      assert.equal(lastNode.textContent, 'Hello world!');
    }
  }

  await buildApp()
    .template('Main', '<Fragment />')
    .template('Fragment', '{{#if showUser}}<h1>User</h1>{{/if}}Hello world!')
    .component('Fragment', Fragment)
    .boot();
});

test('elements are supported', async function(assert) {
  assert.expect(5);

  class Element extends Component {
    showUser = true;

    didInsertElement() {
      let firstNode = this.bounds.firstNode as HTMLElement;
      let lastNode = this.bounds.lastNode as HTMLElement;

      assert.equal(this.element.tagName, 'NAV');
      assert.equal(firstNode.tagName, 'NAV');
      assert.equal(lastNode.tagName, 'NAV');
      assert.strictEqual(this.element, firstNode, 'element and first node are the same');
      assert.strictEqual(firstNode, lastNode, 'first node and last node are the same');
    }
  }

  await buildApp()
    .template('Main', '<Element />')
    .template('Element', '<nav>{{#if showUser}}<h1>User</h1>{{/if}}Hello world!</nav>')
    .component('Element', Element)
    .boot();
});

test('accessing element throws an exception if template is a fragment', async function(assert) {
  assert.expect(1);

  class Fragment extends Component {
    didInsertElement() {
      assert.throws(() => {
        return this.element;
      }, /The 'element' property can only be accessed on components that contain a single root element/);
    }
  }

  await buildApp()
    .template('Main', '<Fragment />')
    .template('Fragment', '{{#if showUser}}<h1>User</h1>{{/if}}Hello world!')
    .component('Fragment', Fragment)
    .boot();
});
