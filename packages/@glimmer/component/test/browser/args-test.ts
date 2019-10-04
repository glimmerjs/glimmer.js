import Component from '@glimmer/component';
import { tracked, setPropertyDidChange } from '@glimmer/tracking';
import { buildApp, TestApplication, didRender } from '@glimmer/application-test-helpers';

const { module, test } = QUnit;

module('[@glimmer/component] Component Arguments');

test('Getters that depend on `args` re-render correctly', async function(assert) {
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
    args: {
      firstName: string
    };

    get name() {
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
