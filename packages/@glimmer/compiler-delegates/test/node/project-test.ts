import { Project } from '@glimmer/compiler-delegates';
import { sync as findup } from 'find-up';

const { module, test } = QUnit;

module('Module Unification Project: Default Configuration', (hooks) => {
  let project: Project;

  hooks.before(() => {
    project = new Project(findup('packages/@glimmer/compiler-delegates/test/node/fixtures/basic-app'));
  });

  test('discovers the package.json', (assert) => {
    assert.deepEqual(project.pkg, {
      name: 'basic-app',
      version: '1.0.0'
    });
  });

  test('builds a resolution map for the project', (assert) => {
    assert.deepEqual(project.map, {
      'component:/basic-app/components/my-app': 'src/ui/components/my-app/component.ts',
      'component:/basic-app/components/my-app/page-banner': 'src/ui/components/my-app/page-banner/component.ts',
      'component:/basic-app/components/my-app/page-banner/titleize': 'src/ui/components/my-app/page-banner/titleize.ts',
      'helper:/basic-app/components/eq': 'src/ui/components/eq/helper.ts',
      'helper:/basic-app/components/if': 'src/ui/components/if/helper.ts',
      'helper:/basic-app/components/moment': 'src/ui/components/moment/helper.ts',
      'template:/basic-app/components/ferret-launcher': 'src/ui/components/ferret-launcher/template.hbs',
      'template:/basic-app/components/my-app': 'src/ui/components/my-app/template.hbs',
      'template:/basic-app/components/my-app/page-banner': 'src/ui/components/my-app/page-banner/template.hbs',
      'template:/basic-app/components/my-app/page-banner/user-avatar': 'src/ui/components/my-app/page-banner/user-avatar/template.hbs',
      'template:/basic-app/components/text-editor': 'src/ui/components/text-editor.hbs',
      'template:/basic-app/components/with-component-helper': 'src/ui/components/with-component-helper/template.hbs'
    });
  });

  test('returns a specifier for a relative path', (assert) => {
    let specifier = project.specifierForPath('src/ui/components/my-app/page-banner/user-avatar/template.hbs');
    assert.equal(specifier, 'template:/basic-app/components/my-app/page-banner/user-avatar');
  });

  test('returns a relative path for a specifier', (assert) => {
    let path = project.pathForSpecifier('template:/basic-app/components/my-app');
    assert.equal(path, 'src/ui/components/my-app/template.hbs');
  });
});

module('Module Unification Project: Custom Configuration', () => {
  test('discovers and uses environment-specific configuration', (assert) => {
    const projectPath = findup('packages/@glimmer/compiler-delegates/test/node/fixtures/app-with-config');

    let project = new Project(projectPath);
    assert.equal(project.environment, 'development', 'environment should be development by default');
    assert.deepEqual(project.config, {
      environment: 'development',
      modulePrefix: 'APP_WITH_CONFIG'
    });

    project = new Project(projectPath, {
      environment: 'production'
    });

    assert.equal(project.environment, 'production');
    assert.deepEqual(project.config, {
      environment: 'production',
      modulePrefix: 'APP_WITH_CONFIG'
    });
  });

  test('builds a resolution map for the project using a custom module prefix', (assert) => {
    const projectPath = findup('packages/@glimmer/compiler-delegates/test/node/fixtures/app-with-config');
    let project = new Project(projectPath);

    assert.deepEqual(project.map, {
      "template:/APP_WITH_CONFIG/components/text-editor": "src/ui/components/text-editor.hbs",
    });
  });

  test('discovers environment-specific configuration at a custom path', (assert) => {
    const projectPath = findup('packages/@glimmer/compiler-delegates/test/node/fixtures/app-with-custom-config');
    let project = new Project(projectPath, {
      paths: {
        config: 'my-config'
      }
    });

    assert.deepEqual(project.config, {
      environment: 'development',
      modulePrefix: 'APP_WITH_CUSTOM_CONFIG'
    });
  });
});
