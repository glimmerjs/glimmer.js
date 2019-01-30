'use strict';

const blueprintHelpers = require('ember-cli-blueprint-test-helpers/helpers');
const setupTestHooks = blueprintHelpers.setupTestHooks;
const emberNew = blueprintHelpers.emberNew;
const { emberGenerateDestroy } = blueprintHelpers;

const expect = require('ember-cli-blueprint-test-helpers/chai').expect;

describe('Classic App Layout: ember generate and destroy a glimmer component', function() {
  setupTestHooks(this);

  it('ember g glimmer x-foo', function() {
    // pass any additional command line options in the arguments array
    return emberNew().then(() =>
      emberGenerateDestroy(['glimmer-component', 'x-foo'], file => {
        expect(file('app/components/x-foo.js')).to.eq(
          `import Component from '@glimmer/component';

export default class XFoo extends Component {

}
`
        );
        expect(file('tests/integration/components/x-foo-test.js')).to.eq(
          `import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | x-foo', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs\`{{x-foo}}\`);

    assert.equal(('' + this.element.textContent).trim(), '');

    // Template block usage:
    await render(hbs\`
      {{#x-foo}}
        template block text
      {{/x-foo}}
    \`);

    assert.equal(('' + this.element.textContent).trim(), 'template block text');
  });
});
`
        );
        expect(file('app/templates/components/x-foo.hbs')).to.eq(
          `{{yield}}
`
        );
      })
    );
  });
  it('ember g glimmer x-foo --lang ts', function() {
    // pass any additional command line options in the arguments array
    return emberNew().then(() =>
      emberGenerateDestroy(
        ['glimmer-component', 'x-foo', '--lang', 'ts'],
        file => {
          expect(file('app/components/x-foo.ts')).to.eq(
            `import Component from '@glimmer/component';

export default class XFoo extends Component {

}
`
          );
          expect(file('tests/integration/components/x-foo-test.ts')).to.eq(
            `import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | x-foo', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs\`{{x-foo}}\`);

    assert.equal(('' + this.element.textContent).trim(), '');

    // Template block usage:
    await render(hbs\`
      {{#x-foo}}
        template block text
      {{/x-foo}}
    \`);

    assert.equal(('' + this.element.textContent).trim(), 'template block text');
  });
});
`
          );
          expect(file('app/templates/components/x-foo.hbs')).to.eq(
            `{{yield}}
`
          );
        }
      )
    );
  });
  it('ember g glimmer x-foo --lang js', function() {
    // pass any additional command line options in the arguments array
    return emberNew().then(() =>
      emberGenerateDestroy(
        ['glimmer-component', 'x-foo', '--lang', 'js'],
        file => {
          expect(file('app/components/x-foo.js')).to.eq(
            `import Component from '@glimmer/component';

export default class XFoo extends Component {

}
`
          );
          expect(file('tests/integration/components/x-foo-test.js')).to.eq(
            `import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | x-foo', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs\`{{x-foo}}\`);

    assert.equal(('' + this.element.textContent).trim(), '');

    // Template block usage:
    await render(hbs\`
      {{#x-foo}}
        template block text
      {{/x-foo}}
    \`);

    assert.equal(('' + this.element.textContent).trim(), 'template block text');
  });
});
`
          );
          expect(file('app/templates/components/x-foo.hbs')).to.eq(
            `{{yield}}
`
          );
        }
      )
    );
  });
});

describe('Classic Addon Layout: ember generate and destroy a glimmer component', function() {
  setupTestHooks(this);

  it('ember g glimmer x-boz', function() {
    // pass any additional command line options in the arguments array
    return emberNew({ target: 'addon' }).then(() =>
      emberGenerateDestroy(['glimmer-component', 'x-boz'], file => {
        expect(file('addon/components/x-boz.js')).to.eq(
          `import Component from '@glimmer/component';

export default class XBoz extends Component {

}
`
        );
        expect(file('addon/templates/components/x-boz.hbs')).to.eq(
          `{{yield}}
`
        );
        expect(file('app/components/x-boz.js')).to.eq(
          `export { default } from 'my-addon/components/x-boz';
`
        );
        expect(file('app/templates/components/x-boz.js')).to.eq(
          `export { default } from 'my-addon/templates/components/x-boz';
`
        );
      })
    );
  });
  it('ember g glimmer x-baz --lang js', function() {
    // pass any additional command line options in the arguments array
    return emberNew({ target: 'addon' }).then(() =>
      emberGenerateDestroy(
        ['glimmer-component', 'x-baz', '--lang', 'js'],
        file => {
          expect(file('addon/components/x-baz.js')).to.eq(
            `import Component from '@glimmer/component';

export default class XBaz extends Component {

}
`
          );
          expect(file('addon/templates/components/x-baz.hbs')).to.eq(
            `{{yield}}
`
          );
          expect(file('app/components/x-baz.js')).to.eq(
            `export { default } from 'my-addon/components/x-baz';
`
          );
          expect(file('app/templates/components/x-baz.js')).to.eq(
            `export { default } from 'my-addon/templates/components/x-baz';
`
          );
        }
      )
    );
  });
  it('ember g glimmer x-biz --lang ts', function() {
    // pass any additional command line options in the arguments array
    return emberNew({ target: 'addon' }).then(() =>
      emberGenerateDestroy(
        ['glimmer-component', 'x-biz', '--lang', 'ts'],
        file => {
          expect(file('addon/components/x-biz.ts')).to.eq(
            `import Component from '@glimmer/component';

export default class XBiz extends Component {

}
`
          );
          expect(file('addon/templates/components/x-biz.hbs')).to.eq(
            `{{yield}}
`
          );
          expect(file('app/components/x-biz.js')).to.eq(
            `export { default } from 'my-addon/components/x-biz';
`
          );
          expect(file('app/templates/components/x-biz.js')).to.eq(
            `export { default } from 'my-addon/templates/components/x-biz';
`
          );
        }
      )
    );
  });
});

describe('MU App Layout: ember generate and destroy a glimmer component', function() {
  setupTestHooks(this);

  it('ember g glimmer x-foo', function() {
    // pass any additional command line options in the arguments array
    return emberNew({ isModuleUnification: true }).then(() =>
      emberGenerateDestroy(
        ['glimmer-component', 'x-foo'],
        file => {
          expect(file('src/ui/components/x-foo/component.js')).to.eq(
            `import Component from '@glimmer/component';

export default class XFoo extends Component {

}
`
          );
          expect(file('src/ui/components/x-foo/template.hbs')).to.eq(
            `{{yield}}
`
          );
        },
        { isModuleUnification: true }
      )
    );
  });
  it('ember g glimmer x-foo --lang js', function() {
    // pass any additional command line options in the arguments array
    return emberNew({ isModuleUnification: true }).then(() =>
      emberGenerateDestroy(
        ['glimmer-component', 'x-foo', '--lang', 'js'],
        file => {
          expect(file('src/ui/components/x-foo/component.js')).to.eq(
            `import Component from '@glimmer/component';

export default class XFoo extends Component {

}
`
          );
          expect(file('src/ui/components/x-foo/template.hbs')).to.eq(
            `{{yield}}
`
          );
        },
        { isModuleUnification: true }
      )
    );
  });
  it('ember g glimmer x-foo --lang ts', function() {
    // pass any additional command line options in the arguments array
    return emberNew({ isModuleUnification: true }).then(() =>
      emberGenerateDestroy(
        ['glimmer-component', 'x-foo', '--lang', 'ts'],
        file => {
          expect(file('src/ui/components/x-foo/component.ts')).to.eq(
            `import Component from '@glimmer/component';

export default class XFoo extends Component {

}
`
          );
          expect(file('src/ui/components/x-foo/template.hbs')).to.eq(
            `{{yield}}
`
          );
        },
        { isModuleUnification: true }
      )
    );
  });
});
