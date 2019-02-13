import Component from '@glimmer/component';
import { tracked, setPropertyDidChange } from '@glimmer/tracking';
import {
  buildApp,
  TestApplication,
  didRender,
} from '@glimmer/application-test-helpers';

const { module, test } = QUnit;

module('[@glimmer/component] Component Arguments');

test('Args smoke test', async function(assert) {
  let done = assert.async();
  assert.expect(6);

  let parent: ParentComponent;
  let app: TestApplication;
  let count = 0;

  class ParentComponent extends Component {
    @tracked firstName = 'Tom';
    isDank = true;
    daysOfSleepRequiredAfterEmberConf = 4;

    constructor(owner, args) {
      super(owner, args);
      parent = this;
    }
  }

  class ChildComponent extends Component {
    oldArgs: any;

    get args() {
      return super.args;
    }

    set args(args) {
      super.args = args;

      assert.ok(Object.isFrozen(this.args));
      assert.notStrictEqual(this.args, this.oldArgs);
      this.oldArgs = this.args;

      if (count++ === 0) {
        assert.propEqual(this.args, {
          firstName: 'Tom',
          isDank: true,
          days: 4,
        });
      } else {
        assert.propEqual(this.args, {
          firstName: 'Thomas',
          isDank: true,
          days: 4,
        });

        done();
      }
    }
  }

  app = await buildApp()
    .component('ParentComponent', ParentComponent)
    .component('ChildComponent', ChildComponent)
    .template('Main', '<div><ParentComponent /></div>')
    .template(
      'ParentComponent',
      `
      <div>
        <ChildComponent
          some-attr=foo
          @firstName={{firstName}}
          @isDank={{isDank}}
          @days={{daysOfSleepRequiredAfterEmberConf}} />
      </div>`
    )
    .template('ChildComponent', '<div></div>')
    .boot();

  setPropertyDidChange(function() {
    app.scheduleRerender();
  });

  parent.firstName = 'Thomas';
});

test('Tracked properties that depend on `args` re-render correctly', async function(assert) {
  assert.expect(2);

  let parent: ParentComponent;
  let app: TestApplication;

  class ParentComponent extends Component {
    @tracked firstName = 'Tom';
    @tracked status = 'is dope';

    constructor(owner, args) {
      super(owner, args);
      parent = this;
    }
  }

  class ChildComponent extends Component {
    constructor(owner, args) {
      super(owner, args);
    }

    @tracked get name() {
      return `${this.args.firstName} Dale`;
    }
  }

  app = await buildApp()
    .component('ParentComponent', ParentComponent)
    .component('ChildComponent', ChildComponent)
    .template('Main', '<div><ParentComponent /></div>')
    .template(
      'ParentComponent',
      `
      <div>
        <ChildComponent @firstName={{firstName}} @status={{status}} />
      </div>`
    )
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

test('Properties that depend on `args` are properly updated when args are updated', async function(assert) {
  assert.expect(4);

  let parent: ParentComponent;
  let app: TestApplication;
  let count = 0;

  class ParentComponent extends Component {
    @tracked firstName = 'Tom';
    @tracked status = 'is dope';

    constructor(owner, args) {
      super(owner, args);
      parent = this;
    }
  }

  class ChildComponent extends Component {
    get name() {
      return `${this.args.firstName} Dale`;
    }

    constructor(owner, args) {
      super(owner, args);
    }

    get args() {
      return super.args;
    }

    set args(args) {
      super.args = args;

      if (count++ === 0) {
        assert.equal(this.name, 'Tom Dale');
        assert.equal(this.args.status, 'is dope');
      } else {
        assert.equal(this.name, 'Thom Dale');
        assert.equal(this.args.status, 'is dank');
      }
    }
  }

  app = await buildApp()
    .component('ParentComponent', ParentComponent)
    .component('ChildComponent', ChildComponent)
    .template('Main', '<div><ParentComponent /></div>')
    .template(
      'ParentComponent',
      `
      <div>
        <ChildComponent @firstName={{firstName}} @status={{status}} />
      </div>`
    )
    .template('ChildComponent', '<div></div>')
    .boot();

  setPropertyDidChange(function() {
    app.scheduleRerender();
  });

  parent.firstName = 'Thom';
  parent.status = 'is dank';

  return didRender(app);
});

test('Setting args should not schedule a rerender', async function(assert) {
  let done = assert.async();
  let app: TestApplication;
  let count = 0;

  class ParentComponent extends Component {
    @tracked foo = false;

    constructor(owner, args) {
      super(owner, args);
      setTimeout(() => {
        this.foo = true;
      }, 1);
    }
  }

  class ChildComponent extends Component {
    get args() {
      return super.args;
    }

    set args(args) {
      super.args = args;

      if (count++ === 1) {
        assert.strictEqual(
          app['_scheduled'],
          false,
          're-render has not been scheduled in update'
        );
        done();
      }
    }
  }

  app = await buildApp()
    .template('Main', '<div><ParentComponent /></div>')
    .template(
      'ParentComponent',
      '<div><ChildComponent @foo={{foo}}></ChildComponent></div>'
    )
    .component('ParentComponent', ParentComponent)
    .template('ChildComponent', '<div></div>')
    .component('ChildComponent', ChildComponent)
    .boot();

  setPropertyDidChange(function() {
    app.scheduleRerender();
  });
});
