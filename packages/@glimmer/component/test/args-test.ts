import Component from '../src/component';
import { tracked } from '../src/tracked';
import buildApp from './test-helpers/test-app';

const { module, test } = QUnit;

module('Component Arguments');

test('Args smoke test', (assert) => {
  let done = assert.async();
  assert.expect(5);

  let parent: ParentComponent;

  class ParentComponent extends Component {
    @tracked firstName = "Tom";
    isDank = true;
    daysOfSleepRequiredAfterEmberConf = 4;

    didInsertElement() {
      parent = this;
    }
  }

  class ChildComponent extends Component {
    oldArgs: any;

    constructor(options: any) {
      super(options);

      assert.propEqual(this.args, {
        firstName: "Tom",
        isDank: true,
        days: 4
      });

      assert.ok(Object.isFrozen(this.args));
      this.oldArgs = this.args;
    }

    didUpdate() {
      assert.propEqual(this.args, {
        firstName: "Thomas",
        isDank: true,
        days: 4
      });

      assert.ok(Object.isFrozen(this.args));
      assert.notStrictEqual(this.args, this.oldArgs);

      done();
    }
  }

  buildApp()
    .component('parent-component', ParentComponent)
    .component('child-component', ChildComponent)
    .template('main', '<div><parent-component /></div>')
    .template('parent-component', `
      <div>
        <child-component
          some-attr=foo
          @firstName={{firstName}}
          @isDank={{isDank}}
          @days={{daysOfSleepRequiredAfterEmberConf}} />
      </div>`)
    .template('child-component', '<div></div>')
    .boot();

  parent.firstName = "Thomas";
});
