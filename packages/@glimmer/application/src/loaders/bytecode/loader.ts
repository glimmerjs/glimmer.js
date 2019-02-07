import {
  ConstantPool,
  Dict,
  DynamicScope,
  ProgramSymbolTable,
  RuntimeProgram,
  TemplateIterator,
  ElementBuilder,
  Environment,
  AotRuntimeContext
} from "@glimmer/interfaces";
import { hydrateProgram } from "@glimmer/program";
import { PathReference } from "@glimmer/reference";
import {
  renderAotComponent,
  renderAotMain,
  RenderComponentArgs
} from "@glimmer/runtime";

import BaseApplication, { Loader } from "../../base-application";
import BytecodeResolver from "./resolver";

export interface SerializedHeap {
  table: number[];
  handle: number;
}

export interface Metadata {
  [key: string]: number | ProgramSymbolTable;

  /** VM handle */
  v?: number;
  /** Handle */
  h?: number;
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
  table: unknown[];
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

  async getTemplateIterator(
    app: BaseApplication,
    env: Environment,
    builder: ElementBuilder,
    dynamicScope: DynamicScope,
    self: PathReference<unknown>
  ): Promise<TemplateIterator> {
    const { mainEntry } = this.data;
    const runtime = await this.getRuntime(app, env);

    return renderAotMain(runtime, self, builder, mainEntry);
  }

  async getComponentTemplateIterator(
    app: BaseApplication,
    env: Environment,
    builder: ElementBuilder,
    componentName: string,
    args: RenderComponentArgs
  ): Promise<TemplateIterator> {
    const runtime = await this.getRuntime(app, env);
    return renderAotComponent(runtime, builder, 0, componentName, args);
  }

  async getRuntime(
    app: BaseApplication,
    env: Environment
  ): Promise<AotRuntimeContext> {
    const resolver = this.getResolver(app);
    const program = await this.getRuntimeProgram(app);

    return {
      env,
      program,
      resolver
    };
  }

  async getRuntimeProgram(app: BaseApplication): Promise<RuntimeProgram> {
    let data = this.data;
    let bytecode = await this.bytecode;
    let { pool, heap: serializedHeap } = data;
    let heap = { ...serializedHeap, buffer: bytecode };

    return hydrateProgram({ heap, constants: pool });
  }

  private getResolver(app: BaseApplication): BytecodeResolver {
    let { table, meta, prefix } = this.data;
    return new BytecodeResolver(app, table, meta, prefix);
  }
}
