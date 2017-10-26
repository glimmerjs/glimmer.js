import Component, { UntrackedPropertyError } from '@glimmer/component';
import { buildApp } from '@glimmer/application-test-helpers';
import { DEBUG } from '@glimmer/env';

const { module, test } = QUnit;

module('[@glimmer/component] Rendering');

test('A component can be rendered in a template', async function(assert) {
  let app = await buildApp()
    .template('Main', '<div><HelloWorld></HelloWorld></div>')
    .template('HelloWorld', '<h1><PersonCard @name="Tom"/></h1>')
    .template('PersonCard', '<span>Hello, {{@name}}!</span>')
    .boot();

  assert.equal(app.rootElement.textContent, 'Hello, Tom!');
});

if (DEBUG) {
  test('Mutating a tracked property throws an exception in development mode', async function(assert) {
    assert.expect(1);

    let done = assert.async();

    class HelloWorldComponent extends Component {
      firstName: string;

      constructor(options: any) {
        super(options);
      }

      didInsertElement() {
        let error = UntrackedPropertyError.for(this, 'firstName');

        assert.throws(() => {
          this.firstName = 'Chad';
        }, error);

        done();
      }
    }

    await buildApp()
      .template('Main', '<div><HelloWorld></HelloWorld></div>')
      .template('HelloWorld', '<h1>Hello, {{firstName}} {{lastName}}!</h1>')
      .component('HelloWorld', HelloWorldComponent)
      .boot();
  });
} else {
  test('Mutating a tracked property should not throw an exception in production mode', async function(assert) {
    assert.expect(1);

    let done = assert.async();

    class HelloWorldComponent extends Component {
      firstName: string;

      constructor(options: any) {
        super(options);
      }

      didInsertElement() {
        // This won't update, but shouldn't throw an error in production mode,
        // either, due to the overhead of installing setters for untracked
        // properties.
        this.firstName = 'Chad';
        assert.ok(true, 'firstName was mutated without throwing an exception');
        done();
      }
    }

    await buildApp()
      .template('Main', '<div><HelloWorld></HelloWorld></div>')
      .template('HelloWorld', '<h1>Hello, {{firstName}} {{lastName}}!</h1>')
      .component('HelloWorld', HelloWorldComponent)
      .boot();
  });
}
