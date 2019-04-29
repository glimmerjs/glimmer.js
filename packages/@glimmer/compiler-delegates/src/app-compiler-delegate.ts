import { Option } from '@glimmer/util';
import { ExternalModuleTable, ModuleLocatorMap } from '@glimmer/bundle-compiler';
import {
  ModuleLocator,
  ConstantPool,
  SerializedHeap,
  SerializedTemplateBlock,
} from '@glimmer/interfaces';

import { Builtins } from './builtins';

export interface OutputFiles {
  dataSegment: Option<string>;
  heapFile: Option<string>;
}

export interface AppCompilerDelegateOptions {
  projectPath: string;
  outputFiles: OutputFiles;
  builtins?: Builtins;
  mainTemplateLocator?: ModuleLocator;
}

export interface DataSegmentInfo {
  table: ExternalModuleTable;
  pool: ConstantPool;
  heap: SerializedHeap;
  compiledBlocks: ModuleLocatorMap<SerializedTemplateBlock>;
  entryHandle: number;
}
