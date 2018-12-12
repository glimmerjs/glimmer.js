import Application, { BytecodeLoader, SyncRenderer } from '@glimmer/application';
import { StringBuilder } from '@glimmer/ssr';
import createHTMLDocument from '@simple-dom/document';
import HTMLSerializer from '@simple-dom/serializer';
import voidMap from '@simple-dom/void-map';
import Resolver, { BasicModuleRegistry } from '@glimmer/resolver';
import { ComponentManager } from '@glimmer/component';
import { BuildServer } from './helpers/build-server';
import { defaultResolverConfiguration } from '@glimmer/application-test-helpers';
import * as fs from 'fs';
import * as path from 'path';

const { module, test } = QUnit;

let buildServer: BuildServer;
module('Application smoke tests', {
  beforeEach() {
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
  }
});

test('Boots and renders an app', async function(assert) {
  let { bytecode, data } = await buildServer.fetch();
  let loader = new BytecodeLoader({ bytecode, data });
  let doc = createHTMLDocument();
  let builder = new StringBuilder({ element: doc.body, nextSibling: null });
  let renderer = new SyncRenderer();
  let serializer = new HTMLSerializer(voidMap);
  let registry = new BasicModuleRegistry({
    "template:/mu/components/Other": true
  });

  let config = {
    app: {
      rootName: 'mu',
      name: 'mu'
    }
  };

  let resolver = new Resolver({...config, ...defaultResolverConfiguration}, registry);

  let app = new Application({
    rootName: 'mu',
    loader,
    document: doc,
    builder,
    renderer,
    resolver
  });

  app.registerInitializer({
    initialize(registry) {
      registry.register(`component-manager:/${app.rootName}/component-managers/main`, ComponentManager);
    }
  });

  await app.boot();

  assert.equal(serializer.serializeChildren(doc.body).trim(), '<div class="user">Chad IF_STUB ID_STUB WAT_STUB</div>\nOther');
});
