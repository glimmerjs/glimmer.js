import Component from '..';
import { buildApp } from '@glimmer/application-test-helpers';
import { DEBUG } from '@glimmer/env';

const { module, test } = QUnit;

module('[@glimmer/component] Rendering');

test('A component can be rendered in a template', (assert) => {
  let app = buildApp()
    .template('Main', '<div><HelloWorld></HelloWorld></div>')
    .template('HelloWorld', '<h1><PersonCard @name="Tom"/></h1>')
    .template('PersonCard', '<span>Hello, {{@name}}!</span>')
    .boot();

  assert.equal(app.rootElement.textContent, 'Hello, Tom!');
});

if (DEBUG) {
  test('Mutating a tracked property throws an exception', (assert) => {
    let done = assert.async();

    class HelloWorldComponent extends Component {
      firstName: string;

      constructor(options: any) {
        super(options);
      }

      didInsertElement() {
        assert.throws(() => {
          this.firstName = 'Chad';
        }, /The 'firstName' property on the hello-world component was changed after it had been rendered. Properties that change after being rendered must be tracked. Use the @tracked decorator to mark this as a tracked property./);

        done();
      }
    }

    buildApp()
      .template('Main', '<div><HelloWorld></HelloWorld></div>')
      .template('HelloWorld', '<h1>Hello, {{firstName}} {{lastName}}!</h1>')
      .component('HelloWorld', HelloWorldComponent)
      .boot();
  });
}
