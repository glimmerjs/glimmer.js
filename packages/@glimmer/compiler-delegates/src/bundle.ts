import { CompilerDelegate, SpecifierMap, Specifier } from '@glimmer/bundle-compiler';
import { ConstantPool } from '@glimmer/program';
import { SerializedTemplateBlock } from '@glimmer/wire-format';
import { ICompilableTemplate } from '@glimmer/opcode-compiler';
import { ProgramSymbolTable } from '@glimmer/interfaces';

export type Metadata = {};

export type AddedTemplate = SerializedTemplateBlock | ICompilableTemplate<ProgramSymbolTable>;

export interface BundleCompilerDelegate extends CompilerDelegate {
  normalizePath(absolutePath: string): string;
  specifierFor(relativePath: string): Specifier;
  generateDataSegment(map: SpecifierMap, pool: ConstantPool, heapTable: number[], nextFreeHandle: number, blocks: Map<Specifier, AddedTemplate>): string;
}
