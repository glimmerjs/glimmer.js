import { CompilerDelegate, SpecifierMap } from '@glimmer/bundle-compiler';
import { ConstantPool } from '@glimmer/program';

export type Metadata = {};

export interface BundleCompilerDelegate extends CompilerDelegate {
  generateDataSegment(map: SpecifierMap, pool: ConstantPool, heapTable: number[]): string;
}
