import { Heap, ConstantPool, RuntimeConstants, RuntimeProgram } from '@glimmer/program';
import { Opaque, Dict } from '@glimmer/util';
import { LowLevelVM, TemplateIterator, ElementBuilder, DynamicScope, ARGS } from '@glimmer/runtime';

import Application, { Loader } from '../../application';
import Environment from '../../environment';

import BytecodeResolver from './resolver';
import { ProgramSymbolTable } from '@glimmer/interfaces';
import { ComponentManager, CAPABILITIES } from '@glimmer/component';
import { RootReference } from '@glimmer/object-reference';

export interface SerializedHeapInfos {
  table: number[];
  handle: number;
}

export interface BytecodeData {
  main: number;
  heap: SerializedHeapInfos;
  pool: ConstantPool;
  table: Opaque[];
  map: Dict<number>;
  symbols: Dict<ProgramSymbolTable>;
  mainSpec: { specifier: string };
}

export interface BytecodeLoaderOptions {
  bytecode: ArrayBuffer | Promise<ArrayBuffer>;
  data: BytecodeData;
}

export default class BytecodeLoader implements Loader {
  protected data: BytecodeData;
  protected bytecode: Promise<ArrayBuffer>;

  constructor({ bytecode, data }: BytecodeLoaderOptions) {
    this.data = data;
    this.bytecode = Promise.resolve(bytecode);
  }

  protected getArgs(symbolTable: ProgramSymbolTable) {
    return symbolTable.symbols.filter(symbol => symbol.charAt(0) === '@');
  }

  protected loadBlocks(vm: LowLevelVM<Opaque>) {
    // Push slots for 3 empty blocks
    for (let i = 0; i <= 9; i++) { vm.stack.push(null); }
  }

  loadMain(vm: LowLevelVM<Opaque>, self: RootReference<Opaque>) {
    let { map, mainSpec, symbols, main } = this.data;
    let mainSpecifier = mainSpec.specifier;
    let symbolTable = symbols[mainSpecifier];
    vm.pc = main;
    vm.pushFrame();

    this.loadBlocks(vm);

    let componentName = self.get('componentName');
    let model = self.get('model');
    vm.stack.push(model);
    vm.stack.push(componentName);

    ARGS.setup(vm.stack, this.getArgs(symbolTable), ['main', 'else', 'attrs'], 0, false);
    vm.stack.push(ARGS);

    vm.stack.push({
      handle: map[mainSpecifier],
      symbolTable: symbols[mainSpecifier]
    });

    vm.stack.push({ state: {
      capabilities: CAPABILITIES
    }, manager: new ComponentManager({ env: vm.env }) });
  }

  async getTemplateIterator(app: Application, env: Environment, builder: ElementBuilder, scope: DynamicScope, self: RootReference<Opaque>): Promise<TemplateIterator> {
    let data = this.data;
    let buffer = await this.bytecode;
    let { pool, heap: serializedHeap, table, map, symbols } = data;

    let heap = new Heap({
      table: serializedHeap.table,
      handle: serializedHeap.handle,
      buffer
    });

    let resolver = new BytecodeResolver(app, table, map, symbols);
    let constants = new RuntimeConstants(resolver, pool);
    let program = new RuntimeProgram(constants, heap);
    let vm = LowLevelVM.empty(program, env, builder);

    this.loadMain(vm, self);

    return new TemplateIterator(vm);
  }
}
