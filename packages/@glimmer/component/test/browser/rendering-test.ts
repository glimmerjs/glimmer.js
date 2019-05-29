import Component from '@glimmer/component';
import { UntrackedPropertyError } from '@glimmer/tracking';
import { buildApp, TestApplication, didRender } from '@glimmer/application-test-helpers';
import { DEBUG } from '@glimmer/env';
import { tracked, setPropertyDidChange } from '@glimmer/tracking';
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

test('colums swap not produce heavy rerender for non-keyed lists', async function(assert) {
  let done = assert.async();
  assert.expect(1);

  let root: RootComponent;
  let app: TestApplication;

  class Row {
    id = 0;
    @tracked label;
    constructor({id, label}) {
      this.id = id;
      this.label = label;
    }
  }

  function createRows(count) {
    return new Array(count).fill(null).map((_, index)=>{
      return new Row({label: index, id: index});
    });
  }

  class RootComponent extends Component {
    observer = null;
    @tracked data = createRows(10);
    didInsertElement() {
      root = this;
      this.observer = new MutationObserver((mutations) => {
        assert.equal(mutations.length, 2, 'we need only 2 dom mutations for this case');
        done();
      });
      const config = { attributes: true, childList: true, characterData: true };
      this.observer.observe(document.querySelector('.keyed'), config);
    }
    swapRows() {
      const a = this.data[2];
      const b = this.data[8];
      this.data[8] = a;
      this.data[2] = b;
      this.data = this.data;
    }
  }

  app = await buildApp()
    .component('RootComponent', RootComponent)
    .template('Main', '<div><RootComponent /></div>')
    .template(
      'RootComponent',
      `
      <ul>
        {{#each this.data key="@index" as |row|}}
          <li>{{row.id}}</li>
        {{/each}}
      </ul>
      `
    )
    .boot();

  setPropertyDidChange(function() {
    app.scheduleRerender();
  });

  root.swapRows();
});

test('colums swap not produce heavy rerender for keyed lists', async function(assert) {
  let done = assert.async();
  assert.expect(1);

  let root: RootComponent;
  let app: TestApplication;

  class Row {
    id = 0;
    @tracked label;
    constructor({id, label}) {
      this.id = id;
      this.label = label;
    }
  }

  function createRows(count) {
    return new Array(count).fill(null).map((_, index)=>{
      return new Row({label: index, id: index});
    });
  }

  class RootComponent extends Component {
    observer = null;
    @tracked data = createRows(10);
    didInsertElement() {
      root = this;
      this.observer = new MutationObserver((mutations) => {
        assert.equal(mutations.length, 2, 'we need only 2 dom mutations for this case');
        done();
      });
      const config = { attributes: true, childList: true, characterData: true };
      this.observer.observe(document.querySelector('.keyed'), config);
    }
    swapRows() {
      const a = this.data[2];
      const b = this.data[8];
      this.data[8] = a;
      this.data[2] = b;
      this.data = this.data;
    }
  }

  app = await buildApp()
    .component('RootComponent', RootComponent)
    .template('Main', '<div><RootComponent /></div>')
    .template(
      'RootComponent',
      `
      <ul>
        {{#each this.data key="id" as |row|}}
          <li>{{row.id}}</li>
        {{/each}}
      </ul>
      `
    )
    .boot();

  setPropertyDidChange(function() {
    app.scheduleRerender();
  });

  root.swapRows();
});

if (DEBUG) {
  test('Mutating a tracked property throws an exception in development mode', async function(assert) {
    assert.expect(1);

    let done = assert.async();
    let update;

    class HelloWorldComponent extends Component {
      firstName: string;

      constructor(owner, args) {
        super(owner, args);

        update = () => {
          let error = UntrackedPropertyError.for(this, 'firstName');

          assert.throws(() => {
            this.firstName = 'Chad';
          }, error);

          done();
        };
      }
    }

    await buildApp()
      .template('Main', '<div><HelloWorld></HelloWorld></div>')
      .template('HelloWorld', '<h1>Hello, {{firstName}} {{lastName}}!</h1>')
      .component('HelloWorld', HelloWorldComponent)
      .boot();

    update();
  });
} else {
  test('Mutating a tracked property should not throw an exception in production mode', async function(assert) {
    assert.expect(1);

    let done = assert.async();
    let update;

    class HelloWorldComponent extends Component {
      firstName: string;

      constructor(owner, args) {
        super(owner, args);

        update = () => {
          // This won't update, but shouldn't throw an error in production mode,
          // either, due to the overhead of installing setters for untracked
          // properties.
          this.firstName = 'Chad';
          assert.ok(true, 'firstName was mutated without throwing an exception');
          done();
        };
      }
    }

    await buildApp()
      .template('Main', '<div><HelloWorld></HelloWorld></div>')
      .template('HelloWorld', '<h1>Hello, {{firstName}} {{lastName}}!</h1>')
      .component('HelloWorld', HelloWorldComponent)
      .boot();

    update();
  });
}
