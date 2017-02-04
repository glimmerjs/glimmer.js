import { UpdatableReference } from '@glimmer/object-reference';
import { OWNER } from '@glimmer/di';
import { templateFactory } from '@glimmer/runtime';
import Component from '../src/component';
import ComponentManager from '../src/component-manager';
import DynamicScope from './test-helpers/dynamic-scope';
import Environment from './test-helpers/environment';
import { precompile } from './test-helpers/compiler';

const { module, test } = QUnit;

module('Integration - Rendering');

test('A component can be rendered in a template', function(assert) {
  class HelloWorld extends Component {
  }

  let helloWorldTemplate = precompile(
    '<h1>Hello {{@name}}!</h1>', 
    { meta: { specifier: 'template:/app/components/hello-world' }});

  let mainTemplate = precompile(
    '<hello-world @name={{salutation}} />', 
    { meta: { specifier: 'template:/app/main/main' }});

  let app = {};
  let env = Environment.create({[OWNER]: app});

  env.registerComponent('hello-world', HelloWorld, helloWorldTemplate);

  let output = document.createElement('output');
  env.begin();

  let ref = new UpdatableReference({
    salutation: 'Glimmer'
  });

  let mainLayout = templateFactory(mainTemplate).create(env);
  mainLayout.render(ref, output, new DynamicScope());

  env.commit();

  assert.equal(output.innerText, 'Hello Glimmer!');
});
