import { BytecodeLoader, SyncRenderer } from '@glimmer/application';
import { SSRApplication } from '@glimmer/ssr';
import Resolver, { BasicModuleRegistry } from '@glimmer/resolver';
import { BuildServer } from './helpers/build-server';
import { defaultResolverConfiguration } from '@glimmer/application-test-helpers';
import * as fs from 'fs';
import * as path from 'path';

const { module, test } = QUnit;

let buildServer;
let ssrAppOpts;

module('SSR Application tests', {
  async beforeEach() {
    let mainLocator = {
      module: './src/ui/components/My-Main/template.hbs',
      name: 'default'
    };
    let relativeProjectPath = 'packages/@glimmer/compiler-delegates/test/node/fixtures/mu';

    buildServer = new BuildServer(relativeProjectPath, mainLocator);
    let { projectPath } = buildServer;

    buildServer.addTemplate(mainLocator, fs.readFileSync(path.join(projectPath, 'src/ui/components/My-Main/template.hbs')).toString());
    buildServer.addTemplate({ module: './src/ui/components/User/template.hbs', name: 'default' }, fs.readFileSync(path.join(projectPath, 'src/ui/components/User/template.hbs')).toString());
    buildServer.addTemplate({ module: './src/ui/components/Other/template.hbs', name: 'default' }, fs.readFileSync(path.join(projectPath, 'src/ui/components/Other/template.hbs')).toString());

    buildServer.build();

    let { bytecode, data } = await buildServer.fetch();
    let loader = new BytecodeLoader({ bytecode, data });
    let renderer = new SyncRenderer();
    let registry = new BasicModuleRegistry({
      "template:/mu/components/Other": true,
      "template:/mu/components/User": true,
      "template:/mu/components/My-Main": true
    });

    let config = {
      app: {
        rootName: 'mu',
        name: 'mu'
      }
    };

    let resolver = new Resolver({...config, ...defaultResolverConfiguration}, registry);

    ssrAppOpts = {
      rootName: 'mu',
      loader,
      renderer,
      resolver
    };
  }
});

test('it renders component to string with specified arguments', async function (assert) {
  const html = await SSRApplication.renderToString('User', {name: 'Chad', Other: 'Other'}, ssrAppOpts);
  assert.equal(html.trim(), '<div class="user">Chad IF_STUB ID_STUB WAT_STUB</div>\nOther');
});

test('it does not reuse the dom across different invocations', async function (assert) {
  let html = await SSRApplication.renderToString('User', {name: 'Chad', Other: 'Other'}, ssrAppOpts);
  assert.equal(html.trim(), '<div class="user">Chad IF_STUB ID_STUB WAT_STUB</div>\nOther');

  html = await SSRApplication.renderToString('User', {name: 'Chirag', Other: 'Other'}, ssrAppOpts);
  assert.equal(html.trim(), '<div class="user">Chirag IF_STUB ID_STUB WAT_STUB</div>\nOther');
});
