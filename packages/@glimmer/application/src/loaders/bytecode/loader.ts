import { Heap, ConstantPool, RuntimeConstants, RuntimeProgram } from '@glimmer/program';
import { Opaque } from '@glimmer/util';
import { LowLevelVM, TemplateIterator, ElementBuilder, DynamicScope } from '@glimmer/runtime';

import Application, { Loader } from '../../application';
import Environment from '../../environment';

import BytecodeResolver from './resolver';
import { PathReference } from '@glimmer/reference';
import { SymbolTable } from '@glimmer/interfaces';

export interface SerializedHeap {
  table: number[];
  handle: number;
}

export interface BytecodeData {
  heap: SerializedHeap;
  pool: ConstantPool;
  table: Opaque[];
  map: Map<string, number>;
  symbols: Map<string, SymbolTable>;
  entryHandle: number;
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

    let heap = new Heap({
      ...data.heap,
      buffer: bytecode
    });

    let { pool, table, entryHandle, map, symbols } = data;

    let resolver = new BytecodeResolver(app, table, map, symbols);
    let constants = new RuntimeConstants(resolver, pool);
    let program = new RuntimeProgram(constants, heap);

    let vm = LowLevelVM.initial(program, env, self, null, scope, builder, entryHandle as any);
    return new TemplateIterator(vm);
  }
}
