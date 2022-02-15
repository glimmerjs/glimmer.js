import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { setComponentTemplate, precompileTemplate } from '@glimmer/core';
import { test, render, settled } from '@glimmer/core/test/utils';

QUnit.module('[@glimmer/component] Component Arguments', () => {
  test('Getters that depend on `args` re-render correctly', async function (assert) {
    assert.expect(2);

    let parent: ParentComponent;

    class ParentComponent extends Component {
      @tracked firstName = 'Tom';
      @tracked status = 'is dope';

      constructor(owner: object, args: {}) {
        super(owner, args);
        parent = this;
      }
    }

    class ChildComponent extends Component<{ firstName: string }> {
      get name(): string {
        return `${this.args.firstName} Dale`;
      }
    }

    setComponentTemplate(
      precompileTemplate(
        '<ChildComponent @firstName={{this.firstName}} @status={{this.status}} />',
        { strictMode: true, scope: { ChildComponent } }
      ),
      ParentComponent
    );

    setComponentTemplate(
      precompileTemplate('{{this.name}} {{@status}}', { strictMode: true }),
      ChildComponent
    );

    assert.equal(await render(ParentComponent), 'Tom Dale is dope');

    parent!.firstName = 'Thom';
    parent!.status = 'is dank';

    assert.equal(await settled(), 'Thom Dale is dank');
  });
});
