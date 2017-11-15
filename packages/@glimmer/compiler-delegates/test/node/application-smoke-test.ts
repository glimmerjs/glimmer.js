import Application, { BytecodeLoader, SyncRenderer } from '@glimmer/application';
import { StringBuilder } from '@glimmer/ssr';
import { module, test} from 'qunitjs';
import * as SimpleDOM from 'simple-dom';
import Resolver, { BasicModuleRegistry } from '@glimmer/resolver';
import { ComponentManager } from '@glimmer/component';
import { BuildServer } from './helpers/build-server';
import { defaultResolverConfiguration } from '@glimmer/application-test-helpers';
import * as fs from 'fs';
import * as path from 'path';

let buildServer;
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

    buildServer.build();
  }
});

test('Boots and renders an app', async function(assert) {
  let { bytecode, data } = await buildServer.fetch();
  let loader = new BytecodeLoader({ bytecode, data });
  let doc = new SimpleDOM.Document();
  let builder = new StringBuilder({ element: doc.body as any, nextSibling: null });
  let renderer = new SyncRenderer();
  let serializer = new SimpleDOM.HTMLSerializer(SimpleDOM.voidMap);
  let registry = new BasicModuleRegistry();
  let resolver = new Resolver(defaultResolverConfiguration, registry);

  let app = new Application({
    rootName: 'app',
    loader,
    document: doc as any,
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

  assert.equal(serializer.serializeChildren(doc.body as any).trim(), '<div class="user">Chad STUB</div>');
});
