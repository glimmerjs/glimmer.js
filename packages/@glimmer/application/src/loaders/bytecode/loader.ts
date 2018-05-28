import { Heap, ConstantPool, RuntimeConstants, RuntimeProgram } from '@glimmer/program';
import { Opaque, Dict } from '@glimmer/util';
import { TemplateIterator, ElementBuilder, DynamicScope, renderMain } from '@glimmer/runtime';

import Application, { Loader } from '../../application';
import Environment from '../../environment';

import BytecodeResolver from './resolver';
import { PathReference } from '@glimmer/reference';
import { ProgramSymbolTable } from '@glimmer/interfaces';

export interface SerializedHeap {
  table: number[];
  handle: number;
}

export interface Metadata {
  /** VM handle */
  v: number;
  /** Handle */
  h: number;

  table: ProgramSymbolTable;
}

/**
 * Additional metadata that accompanies the binary bytecode data.
 *
 * @public
 */
export interface BytecodeData {
  prefix: string;
  mainEntry: number;
  heap: SerializedHeap;
  pool: ConstantPool;
  meta: Dict<Metadata>;
  table: Opaque[];
}

export interface BytecodeLoaderOptions {
  bytecode: ArrayBuffer | Promise<ArrayBuffer>;
  data: BytecodeData;
}

/**
 * Initializes an Application with a binary bytecode (.gbx) file containing
 * compiled templates.
 *
 * @remarks
 * Once all of the templates have been parsed into IR, the compiler performs a
 * final pass that resolves symbolic addresses and writes the final opcodes into
 * a shared binary buffer. In native compiler terms, you can think of this as
 * the "linking" step that produces the final executable. This binary executable
 * is saved to disk as a .gbx file that can be served to a browser and evaluated
 * with the runtime.
 *
 * For details, see {@link Application}.
 *
 * @public
 */
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
    let { pool, heap: serializedHeap, table, meta, prefix, mainEntry } = data;

    let heap = new Heap({
      table: serializedHeap.table,
      handle: serializedHeap.handle,
      buffer: bytecode
    });

    let resolver = new BytecodeResolver(app, table, meta, prefix);
    let constants = new RuntimeConstants(resolver, pool);
    let program = new RuntimeProgram(constants, heap);

    return renderMain(program, env, self, scope, builder, mainEntry);
  }
}
