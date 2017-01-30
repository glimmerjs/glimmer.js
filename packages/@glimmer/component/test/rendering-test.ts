import { UpdatableReference } from '@glimmer/object-reference';
import { Owner, OWNER, Factory } from '@glimmer/di';
import { templateFactory } from '@glimmer/runtime';
import Component from '../src/component';
import ComponentManager from '../src/component-manager';
import DynamicScope from '../src/dynamic-scope';
import Environment from '../src/environment';
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

  class FakeApp implements Owner {
    identify(specifier: string, referrer?: string): string {
      if (specifier === 'component:hello-world' &&
          referrer === 'template:/app/main/main') {
        return 'component:/app/components/hello-world';
      } else {
        throw new Error('Unexpected');
      }
    }

    factoryFor(specifier: string, referrer?: string): Factory<any> {
      if (specifier === 'component:/app/components/hello-world') {
        return HelloWorld;
      } else {
        throw new Error('Unexpected');
      }
    }
  
    lookup(specifier: string, referrer?: string): any {
      if (specifier === 'template' && referrer === 'component:/app/components/hello-world') {
        return helloWorldTemplate;
      } else {
        throw new Error('Unexpected');
      }
    }
  }

  let app = new FakeApp();
  let env = Environment.create({[OWNER]: app});

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
