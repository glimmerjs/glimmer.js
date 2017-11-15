import Application, { BytecodeLoader, SyncRenderer } from '@glimmer/application';
import { StringBuilder } from '@glimmer/ssr';
import { module, test} from 'qunitjs';
import * as SimpleDOM from 'simple-dom';
import Resolver, { BasicModuleRegistry } from '@glimmer/resolver';
import { ComponentManager } from '@glimmer/component';
import { BuildServer } from './helpers/build-server';
import * as fs from 'fs';
import * as path from 'path';

let buildServer;
module('Application smoke tests', {
  beforeEach() {
    buildServer = new BuildServer();
    let { projectPath } = buildServer;

    buildServer.addTemplate({ module: './src/ui/components/My-Main/template.hbs', name: 'default' }, fs.readFileSync(path.join(projectPath, 'src/ui/components/My-Main/template.hbs')).toString());
    buildServer.addTemplate({ module: './src/ui/components/User/template.hbs', name: 'default' }, fs.readFileSync(path.join(projectPath, 'src/ui/components/User/template.hbs')).toString());

    buildServer.build();
  }
});

let defaultResolverMap = {
  app: {
    name: 'smoke',
    rootName: 'smoke'
  },
  types: {
    application: { definitiveCollection: 'main' },
    component: { definitiveCollection: 'components' },
    helper: { definitiveCollection: 'components' },
    renderer: { definitiveCollection: 'main' },
    template: { definitiveCollection: 'components' },
    util: { definitiveCollection: 'utils' },
    'component-manager': { definitiveCollection: 'component-managers' }
  },
  collections: {
    main: {
      types: ['application', 'renderer']
    },
    components: {
      group: 'ui',
      types: ['component', 'template', 'helper'],
      defaultType: 'component'
    },
    'component-managers': {
      types: ['component-manager']
    },
    utils: {
      unresolvable: true
    }
  }
};

test('Boots and renders an app', async function(assert) {
  let { bytecode, data } = await buildServer.fetch();
  let loader = new BytecodeLoader({ bytecode, data });
  let doc = new SimpleDOM.Document();
  let builder = new StringBuilder({ element: doc.body, nextSibling: null });
  let renderer = new SyncRenderer();
  let serializer = new SimpleDOM.HTMLSerializer(SimpleDOM.voidMap);
  let registry = new BasicModuleRegistry();
  let resolver = new Resolver(defaultResolverMap, registry);

  let app = new Application({
    rootName: 'app',
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

  assert.equal(serializer.serializeChildren(doc.body).trim(), '<div class="user">Chad STUB</div>');
});
