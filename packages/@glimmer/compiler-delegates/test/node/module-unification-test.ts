import { MUCodeGenerator } from '@glimmer/compiler-delegates';
import { module, test } from 'qunitjs';
import { ModuleLocatorMap, ExternalModuleTable, BundleCompilationResult } from '@glimmer/bundle-compiler';
import { Program, ConstantPool } from '@glimmer/program';
import { sync as findup} from 'find-up';
import { ProgramSymbolTable } from '@glimmer/interfaces';
import { Project } from 'glimmer-analyzer';

let generator: MUCodeGenerator;

let table: ExternalModuleTable;
let program: Program<{}>;
let pool: ConstantPool;
let symbolTables: ModuleLocatorMap<ProgramSymbolTable>;

module('Module Unification Delegate', {
  beforeEach() {
    let projectPath = findup('packages/@glimmer/compiler-delegates/test/node/fixtures');
    let project = new Project(projectPath);

    table = new ExternalModuleTable();
    program = new Program();
    pool = program.constants.toPool();
    symbolTables = new ModuleLocatorMap();
    let compilation: BundleCompilationResult = {
      main: 0,
      heap: program.heap.capture(),
      pool,
      table,
      symbolTables
    };

    let outputFiles = {
      dataSegment: 'data.ts',
      heapFile: 'templates.gbx'
    };

    generator = new MUCodeGenerator(
      project,
      outputFiles,
      {},
      compilation
    );
  }
});

test('can generate the serialized constants pool ', (assert) => {
  pool.strings.push('a', 'b', 'c');
  pool.floats.push(1.2, 1.1);
  pool.handles.push(1, 2, 3);
  let serializedPool = generator.generateConstantPool(pool);

  assert.equal(serializedPool, `const pool =JSON.parse(${JSON.stringify(JSON.stringify(pool))});`);
});

test('can generate the heap table', (assert) => {
  let heap = { table: [0, 650, 40, 700], handle: 50, buffer: new ArrayBuffer(1) };
  let serializedHeaptable = generator.generateHeap(heap as any);

  assert.equal(serializedHeaptable, `const heap =JSON.parse(${JSON.stringify(JSON.stringify({ table: [0, 650, 40, 700], handle: 50 }))});`);
});

test('heap table should be balanced', (assert) => {
  assert.throws(() => {
    generator.generateHeap({ table: [0, 650, 40] } as any);
  }, /Heap table should be balanced and divisible by 2/);
});

test('can generate the specifier map', (assert) => {
  table.vmHandleByModuleLocator.set({name: 'default', module: './src/ui/components/x/template.hbs' }, 0);
  let serializedTable = generator.generateSpecifierMap(table);

  assert.equal(serializedTable, `const map = JSON.parse(${JSON.stringify(JSON.stringify({'template:/my-project/components/x': 0}))});`);
});

test('specifier\'s module path needs to be well formed', (assert) => {
  table.vmHandleByModuleLocator.set({name: 'default', module: 'B' }, 0);

  assert.equal(generator.generateSpecifierMap(table), 'const map = JSON.parse("{}");', 'does not generate specifier map entry for non-MU modules');
});

test('can generate symbol tables', (assert) => {
  symbolTables.set({name: 'default', module: './src/ui/components/x/template.hbs' }, {
    hasEval: false,
    symbols: []
  } as any);
  let serializedSymbolTables = generator.generateSymbolTables(symbolTables);
  assert.equal(serializedSymbolTables, `const symbols = JSON.parse(${JSON.stringify(JSON.stringify({"template:/my-project/components/x": {hasEval: false, symbols: []} }))});`);
});

test('can generate the external module table', (assert) => {
  table.byHandle.set(0, {name: 'default', module: './src/ui/components/x/template.hbs'});
  let serializedModuleTable = generator.generateExternalModuleTable(table);
  assert.equal(serializedModuleTable, `\nimport component_0 from \"./src/ui/components/x/component\";\nconst table = [component_0];\n`);
});
