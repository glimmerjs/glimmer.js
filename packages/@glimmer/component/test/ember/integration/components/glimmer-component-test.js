import GlimmerComponent from '@glimmer/component';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, clearRender, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { getOwner } from '@ember/application';
import { set } from '@ember/object';

module('Integration | Component | @glimmer/component', function(hooks) {
  let InstrumentedComponent;

  setupRenderingTest(hooks);

  hooks.beforeEach(function(assert) {
    InstrumentedComponent = class extends GlimmerComponent {
      constructor() {
        super(...arguments);
        assert.step('constructor');
      }

      willDestroy() {
        assert.step('willDestroy');
      }
    }
  });

  test('it can render with curlies (no args)', async function(assert) {
    this.owner.register('component:under-test', InstrumentedComponent);

    await render(hbs`{{under-test}}`);

    assert.verifySteps(['constructor'], 'initial setup steps');

    await clearRender();

    assert.verifySteps(['willDestroy'], 'post destroy steps');
  });

  test('it can render and update with curlies (args)', async function(assert) {
    this.owner.register('component:under-test', InstrumentedComponent);
    this.owner.register('template:components/under-test', hbs`<p>{{@text}}</p>`);

    this.set('text', 'hello!');
    await render(hbs`{{under-test text=this.text}}`);

    assert.dom('p').hasText('hello!');
    assert.verifySteps(['constructor'], 'initial render steps');

    this.set('text', 'hello world!');

    assert.dom('p').hasText('hello world!');
    assert.verifySteps([], 'no rerender steps');

    this.set('text', 'hello!');

    assert.dom('p').hasText('hello!');
    assert.verifySteps([], 'no rerender steps');

    await clearRender();

    assert.verifySteps(['willDestroy'], 'post destroy steps');
  });

  test('it can render with angles (no args)', async function(assert) {
    this.owner.register('component:under-test', InstrumentedComponent);

    await render(hbs`<UnderTest />`);

    assert.verifySteps(['constructor'], 'initial render steps');

    await clearRender();

    assert.verifySteps(['willDestroy'], 'post destroy steps');
  });

  test('it can render and update with angles (args)', async function(assert) {
    this.owner.register('component:under-test', InstrumentedComponent);
    this.owner.register('template:components/under-test', hbs`<p>{{@text}}</p>`);

    this.set('text', 'hello!');
    await render(hbs`<UnderTest @text={{this.text}} />`);

    assert.dom('p').hasText('hello!');
    assert.verifySteps(['constructor'], 'initial render steps');

    this.set('text', 'hello world!');

    assert.dom('p').hasText('hello world!');
    assert.verifySteps([], 'no rerender steps');

    this.set('text', 'hello!');

    assert.dom('p').hasText('hello!');
    assert.verifySteps([], 'no rerender steps');

    await clearRender();

    assert.verifySteps(['willDestroy'], 'post destroy steps');
  });

  test('it can use args in component', async function(assert) {
    this.owner.register('component:under-test', class extends GlimmerComponent {
      get text() {
        return this.args.text.toUpperCase();
      }
    });
    this.owner.register('template:components/under-test', hbs`<p>{{this.text}}</p>`);

    this.set('text', 'hello!');
    await render(hbs`<UnderTest @text={{this.text}} />`);
    assert.dom('p').hasText('HELLO!');
  });

  test('it can use args in constructor', async function(assert) {
    this.owner.register('component:under-test', class extends GlimmerComponent {
      constructor() {
        super(...arguments);

        this.text = this.args.text.toUpperCase();
      }
    });
    this.owner.register('template:components/under-test', hbs`<p>{{this.text}}</p>`);

    this.set('text', 'hello!');
    await render(hbs`<UnderTest @text={{this.text}} />`);
    assert.dom('p').hasText('HELLO!');
  });

  test('it can use get/set to recompute for changes', async function(assert) {
    this.owner.register('component:under-test', class extends GlimmerComponent {
      constructor() {
        super(...arguments);

        this.count = 0;
      }

      increment() {
        set(this, 'count', this.count + 1);
      }
    });
    this.owner.register(
      'template:components/under-test',
      hbs`<p>Count: {{this.count}}</p><button data-test="increment" onclick={{action this.increment}}>Increment</button>`
    );

    await render(hbs`<UnderTest />`);
    assert.dom('p').hasText('Count: 0');

    await click('button[data-test=increment]');
    assert.dom('p').hasText('Count: 1');

    await click('button[data-test=increment]');
    assert.dom('p').hasText('Count: 2');
  });

  test('does not update for non-tracked property changes', async function(assert) {
    this.owner.register('component:under-test', class extends GlimmerComponent {
      constructor() {
        super(...arguments);

        this._count = 0;
      }

      get count() {
        return this._count;
      }

      set count(value) {
        this._count = value;
      }

      increment() {
        this.count++;
      }
    });
    this.owner.register(
      'template:components/under-test',
      hbs`<p>Count: {{this.count}}</p><button data-test="increment" onclick={{action this.increment}}>Increment</button>`
    );

    await render(hbs`<UnderTest />`);
    assert.dom('p').hasText('Count: 0');

    await click('button[data-test=increment]');
    assert.dom('p').hasText('Count: 0');

    await click('button[data-test=increment]');
    assert.dom('p').hasText('Count: 0');
  });

  test('it has an owner', async function(assert) {
    this.owner.register('component:under-test', class extends GlimmerComponent {
      get environment() {
        return getOwner(this).resolveRegistration("config:environment").environment;
      }
    });
    this.owner.register(
      'template:components/under-test',
      hbs`<p>Environment: {{this.environment}}</p>`
    );
    await render(hbs`<UnderTest />`);
    assert.dom('p').hasText('Environment: test');
  });

  test('it has an owner', async function(assert) {
    this.owner.register('component:under-test', class extends GlimmerComponent {
      constructor() {
        super(...arguments);

        this.environment = getOwner(this).resolveRegistration("config:environment").environment;
      }
    });
    this.owner.register(
      'template:components/under-test',
      hbs`<p>Environment: {{this.environment}}</p>`
    );
    await render(hbs`<UnderTest />`);
    assert.dom('p').hasText('Environment: test');
  });
});
