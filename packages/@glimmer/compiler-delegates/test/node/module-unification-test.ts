import { ModuleUnificationCompilerDelegate, AddedTemplate } from '@glimmer/compiler-delegates';
import { module, test } from 'qunitjs';
import { SpecifierMap, Specifier } from '@glimmer/bundle-compiler';
import { Program, ConstantPool } from '@glimmer/program';
import * as path from 'path';
import { sync as findup} from 'find-up';

let delegate: ModuleUnificationCompilerDelegate;
let specifierMap: SpecifierMap;
let program: Program<Specifier>;
let pool: ConstantPool;
let symbolTables: Map<Specifier, AddedTemplate>;

module('Module Unification Delegate', {
  beforeEach() {
    let projectPath = findup('packages/@glimmer/compiler-delegates/test/node/fixtures');
    specifierMap = new SpecifierMap();
    program = new Program();
    pool = program.constants.toPool();
    symbolTables = new Map();
    delegate = new ModuleUnificationCompilerDelegate(projectPath, {
      dataSegment: 'data.ts',
      heapFile: 'templates.gbx'
    });
  }
});

test('can generate the serialized constants pool ', (assert) => {
  pool.strings.push('a', 'b', 'c');
  pool.floats.push(1.2, 1.1);
  pool.handles.push(1, 2, 3);
  let serializedPool = delegate.generateConstantPool(pool);

  assert.equal(serializedPool, `const pool =JSON.parse(${JSON.stringify(JSON.stringify(pool))});`);
});

test('can generate the heap table', (assert) => {
  let serializedHeaptable = delegate.generateHeapTable([0, 650, 40, 700]);

  assert.equal(serializedHeaptable, `const heapTable =JSON.parse(${JSON.stringify(JSON.stringify([0, 650, 40, 700]))});`);
});

test('heap table should be balanced', (assert) => {
  assert.throws(() => {
    delegate.generateHeapTable([0, 650, 40]);
  }, /Heap table should be balanced and divisible by 2/);
});

test('can generate the specifierMap', (assert) => {
  specifierMap.vmHandleBySpecifier.set({name: 'default', module: 'src/ui/components/x/template.hbs' }, 0);
  let serializedSpecifierMap = delegate.generateSpecifierMap(specifierMap);

  assert.equal(serializedSpecifierMap, `const specifierMap = JSON.parse(${JSON.stringify(JSON.stringify({'template:/my-project/components/x': 0}))});`);
});

test('specifier\'s module path needs to be well formed', (assert) => {
  specifierMap.vmHandleBySpecifier.set({name: 'default', module: 'B' }, 0);

  assert.throws(() => {
    delegate.generateSpecifierMap(specifierMap);
  }, /expected to have a MU specifier for module B/);
});

test('can generate symbol tables', (assert) => {
  symbolTables.set({name: 'default', module: 'src/ui/components/x/template.hbs' }, {
    hasEval: false,
    symbols: [],
    statements: []
  });
  let serializedSymbolTables = delegate.generateSymbolTables(symbolTables);
  assert.equal(serializedSymbolTables, `const symbolTables = JSON.parse(${JSON.stringify(JSON.stringify({"template:/my-project/components/x": {hasEval: false, symbols: [], referrer: null} }))});`);
});

test('can generate the external module table', (assert) => {
  specifierMap.byHandle.set(0, {name: 'default', module: 'src/ui/components/x/template.hbs'});
  let serializedModuleTable = delegate.generateExternalModuleTable(specifierMap);
  assert.equal(serializedModuleTable, `\nimport __src_ui_components_x_component__ from \"./src/ui/components/x/component\";\nconst moduleTable = [__src_ui_components_x_component__];\n`);
});
