import Component from '../src/index';
import buildApp from './test-helpers/test-app';
import { DEBUG } from '@glimmer/env';

const { module, test } = QUnit;

module('Rendering');

test('A component can be rendered in a template', (assert) => {
  let app = buildApp()
    .template('main', '<div><hello-world></hello-world></div>')
    .template('hello-world', '<h1><person-card @name="Tom"/></h1>')
    .template('person-card', '<span>Hello, {{@name}}!</span>')
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
      .template('main', '<div><hello-world></hello-world></div>')
      .template('hello-world', '<h1>Hello, {{firstName}} {{lastName}}!</h1>')
      .component('hello-world', HelloWorldComponent)
      .boot();
  });
}
