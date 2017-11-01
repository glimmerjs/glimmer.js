import { Option } from "@glimmer/util";
import {
  CompilerDelegate,
  BundleCompilationResult,
  TemplateLocator,
  ModuleLocator,
  ExternalModuleTable,
  ModuleLocatorMap
} from "@glimmer/bundle-compiler";
import { ConstantPool, SerializedHeap } from "@glimmer/program";
import { SerializedTemplateBlock } from '@glimmer/wire-format';

import { Builtins } from "./builtins";

export interface OutputFiles {
  dataSegment: Option<string>;
  heapFile: Option<string>;
}

export interface AppCompilerDelegateOptions {
  projectPath: string;
  outputFiles: OutputFiles;
  builtins?: Builtins;
}

/**
 * The AppCompilerDelegate extends Glimmer VM's template-oriented
 * CompilerDelegate with additional application-level compilation concerns that
 * support compiling an entire Glimmer.js application into the final JavaScript
 * and bytecode output.
 */
export default interface AppCompilerDelegate<Meta> extends CompilerDelegate<Meta> {
  /**
   * Allows the delegate to normalize a path to a module in the project. The
   * value returned from this hook is used as the `module` field in the
   * associated file's ModuleLocator.
   *
   * The meaning of "normalization" is dependent on the particular delegate.
   * Delegates can return the passed absolute path to maintain absolute paths
   * throughout, or they might normalize absolute paths into a path relative to
   * the project root, for example.
   */
  normalizePath(absolutePath: string): string;

  /**
   * Should return a TemplateLocator annotated with additional metadata about the
   * template located at the provided ModuleLocator. Delegates should add
   * additional metadata needed for component or helper resolution, either at
   * compile-time or runtime.
   */
  templateLocatorFor(moduleLocator: ModuleLocator): TemplateLocator<Meta>;

  /**
   * Should return a string of JavaScript source code that serializes the data
   * segment information provided by the compiler. This code should be able to
   * be evaluated in the browser and, together with the bytecode, used by an
   * application loader to fully rehydrate the compiled program on the client.
   */
  generateDataSegment(compilation: BundleCompilationResult): string;
}

export interface DataSegmentInfo {
  table: ExternalModuleTable;
  pool: ConstantPool;
  heap: SerializedHeap;
  compiledBlocks: ModuleLocatorMap<SerializedTemplateBlock>;
  entryHandle: number;
}
