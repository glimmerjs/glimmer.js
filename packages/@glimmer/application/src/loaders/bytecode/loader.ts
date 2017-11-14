import { Heap, ConstantPool, RuntimeConstants, RuntimeProgram } from '@glimmer/program';
import { Opaque, Dict } from '@glimmer/util';
import { LowLevelVM, TemplateIterator, ElementBuilder, DynamicScope } from '@glimmer/runtime';

import Application, { Loader } from '../../application';
import Environment from '../../environment';

import BytecodeResolver from './resolver';
import { PathReference } from '@glimmer/reference';
import { VMHandle, Recast, ProgramSymbolTable } from '@glimmer/interfaces';

export interface SerializedHeap {
  table: number[];
  handle: number;
}

export interface BytecodeData {
  main: number;
  heap: SerializedHeap;
  pool: ConstantPool;
  table: Opaque[];
  map: Dict<number>;
  symbols: Dict<ProgramSymbolTable>;
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
    let bytecode = await this.bytecode;
    let { pool, heap: serializedHeap, table, map, symbols, main } = data;

    let heap = new Heap({
      table: serializedHeap.table,
      handle: serializedHeap.handle,
      buffer: bytecode
    });

    let resolver = new BytecodeResolver(app, table, map, symbols);
    let constants = new RuntimeConstants(resolver, pool);
    let program = new RuntimeProgram(constants, heap);

    let vm = LowLevelVM.initial(program, env, self, null, scope, builder, main as Recast<number, VMHandle>);
    return new TemplateIterator(vm);
  }
}
