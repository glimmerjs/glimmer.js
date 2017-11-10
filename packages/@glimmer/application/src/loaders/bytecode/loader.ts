import { Heap, ConstantPool, RuntimeConstants, RuntimeProgram } from '@glimmer/program';
import { Opaque, Dict } from '@glimmer/util';
import { LowLevelVM, TemplateIterator, ElementBuilder, DynamicScope } from '@glimmer/runtime';

import Application, { Loader } from '../../application';
import Environment from '../../environment';

import BytecodeResolver from './resolver';
import { PathReference } from '@glimmer/reference';
import { SymbolTable, VMHandle, Recast } from '@glimmer/interfaces';

export interface BytecodeData {
  main: number;
  entryHandle: number;
  nextFreeHandle: number;
  heapTable: number[];
  heap:  number[];
  pool: ConstantPool;
  table: Opaque[];
  map: Dict<number>;
  symbols: Dict<SymbolTable>;
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

  async getTemplateIterator(app: Application, env: Environment, builder: ElementBuilder, scope: DynamicScope, self: PathReference<Opaque>): Promise<TemplateIterator> {
    let data = this.data;
    let buffer = await this.bytecode;
    let { pool, heapTable, table, entryHandle: main, map, symbols, nextFreeHandle: handle } = data;

    let heap = new Heap({
      table: heapTable,
      handle,
      buffer
    });

    let resolver = new BytecodeResolver(app, table, map, symbols);
    let constants = new RuntimeConstants(resolver, pool);
    let program = new RuntimeProgram(constants, heap);

    let vm = LowLevelVM.initial(program, env, self, null, scope, builder, main as Recast<number, VMHandle>);
    return new TemplateIterator(vm);
  }
}
