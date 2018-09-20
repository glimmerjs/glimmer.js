import Component, { tracked, setPropertyDidChange } from '@glimmer/component';
import { buildApp, TestApplication, didRender } from '@glimmer/application-test-helpers';

const { module, test } = QUnit;

module('[@glimmer/component] Component Arguments');

test('Args smoke test', async function (assert) {
  let done = assert.async();
  assert.expect(5);

  let parent: ParentComponent;
  let app: TestApplication;

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

  app = await buildApp()
    .component('ParentComponent', ParentComponent)
    .component('ChildComponent', ChildComponent)
    .template('Main', '<div><ParentComponent /></div>')
    .template('ParentComponent', `
      <div>
        <ChildComponent
          some-attr=foo
          @firstName={{firstName}}
          @isDank={{isDank}}
          @days={{daysOfSleepRequiredAfterEmberConf}} />
      </div>`)
    .template('ChildComponent', '<div></div>')
    .boot();

  setPropertyDidChange(function() {
    app.scheduleRerender();
  });

  parent.firstName = "Thomas";
});

test('Tracked properties that depend on `args` re-render correctly', async function (assert) {
  assert.expect(2);

  let parent: ParentComponent;
  let app: TestApplication;

  class ParentComponent extends Component {
    @tracked firstName = 'Tom';
    @tracked status = 'is dope';

    didInsertElement() {
      parent = this;
    }
  }

  class ChildComponent extends Component {
    @tracked get name() {
      return `${this.args.firstName} Dale`;
    }
  }

  app = await buildApp()
    .component('ParentComponent', ParentComponent)
    .component('ChildComponent', ChildComponent)
    .template('Main', '<div><ParentComponent /></div>')
    .template('ParentComponent', `
      <div>
        <ChildComponent @firstName={{firstName}} @status={{status}} />
      </div>`)
    .template('ChildComponent', '<div>{{name}} {{@status}}</div>')
    .boot();

  setPropertyDidChange(function() {
    app.scheduleRerender();
  });

  assert.equal(app.rootElement.textContent.trim(), 'Tom Dale is dope');

  parent.firstName = 'Thom';
  parent.status = 'is dank';

  return didRender(app).then(() => {
    assert.equal(app.rootElement.textContent.trim(), 'Thom Dale is dank');
  });
});

test('Properties that depend on `args` are properly updated before the `didUpdate` hook', async function(assert) {
  assert.expect(4);

  let parent: ParentComponent;
  let app: TestApplication;

  class ParentComponent extends Component {
    @tracked firstName = 'Tom';
    @tracked status = 'is dope';

    didInsertElement() {
      parent = this;
    }
  }

  class ChildComponent extends Component {
    get name() {
      return `${this.args.firstName} Dale`;
    }

    constructor(injections: object) {
      super(injections);
      assert.equal(this.name, 'Tom Dale');
      assert.equal(this.args.status, 'is dope');
    }

    didUpdate() {
      assert.equal(this.name, 'Thom Dale');
      assert.equal(this.args.status, 'is dank');
    }
  }

  app = await buildApp()
    .component('ParentComponent', ParentComponent)
    .component('ChildComponent', ChildComponent)
    .template('Main', '<div><ParentComponent /></div>')
    .template('ParentComponent', `
      <div>
        <ChildComponent @firstName={{firstName}} @status={{status}} />
      </div>`)
    .template('ChildComponent', '<div></div>')
    .boot();

  setPropertyDidChange(function() {
    app.scheduleRerender();
  });

  parent.firstName = 'Thom';
  parent.status = 'is dank';

  return didRender(app);
});

test("Setting args should not schedule a rerender", async function(assert) {
  let done = assert.async();
  let app: TestApplication;

  class ParentComponent extends Component {
    @tracked foo = false;

    constructor(options: any) {
      super(options);
      setTimeout(() => {
        this.foo = true;
      }, 1);
    }

    didUpdate() {
      assert.strictEqual(app['_scheduled'], false, 're-render has not been scheduled in update');
      done();
    }
  }

  class ChildComponent extends Component {
  }

  app = await buildApp()
    .template('Main', '<div><ParentComponent /></div>')
    .template('ParentComponent', '<div><ChildComponent @foo={{foo}}></ChildComponent></div>')
    .component('ParentComponent', ParentComponent)
    .template('ChildComponent', '<div></div>')
    .component('ChildComponent', ChildComponent)
    .boot();

  setPropertyDidChange(function() {
    app.scheduleRerender();
  });
});
