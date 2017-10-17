import { ICompilableTemplate, CompilableTemplate, CompileOptions } from '@glimmer/opcode-compiler';
import { ComponentCapabilities, ProgramSymbolTable } from '@glimmer/interfaces';
import { expect } from '@glimmer/util';
import { specifierFor, BundleCompiler, CompilerDelegate, Specifier } from '@glimmer/bundle-compiler';
import Scope from '../scope';
import { SerializedTemplateBlock } from '@glimmer/wire-format';
import * as path from 'path';
import { sync as resolveSync } from 'resolve';
import { CAPABILITIES } from '../capabilities';

export interface BasicMetadata {
  scope: Scope;
}

export default class BasicCompilerDelegate implements CompilerDelegate {
  bundleCompiler: BundleCompiler;

  protected scopes = new Map<Specifier, Scope>();

  add(modulePath: string, templateSource: string, meta: BasicMetadata) {
    let specifier = specifierFor(modulePath, 'default');
    this.bundleCompiler.add(specifier, templateSource);

    this.scopes.set(specifier, meta.scope);
  }

  hasComponentInScope(componentName: string, referrer: Specifier): boolean {
    let scope = expect(this.scopes.get(referrer), `could not find scope for ${referrer}`);

    return componentName in scope;
  }

  resolveComponentSpecifier(componentName: string, referrer: Specifier): Specifier {
    let scope = expect(this.scopes.get(referrer), `could not find scope for ${referrer}`);

    let { module, name } = scope[componentName];

    let basedir = path.dirname(path.resolve(process.cwd(), referrer.module));
    let resolved = resolveSync(module, { basedir, extensions: ['.ts', '.js'] });
    resolved = './' + path.relative(process.cwd(), resolved);

    return specifierFor(resolved, name);
  }

  getComponentCapabilities(_specifier: Specifier): ComponentCapabilities {
    return CAPABILITIES;
  }

  getComponentLayout(_specifier: Specifier, block: SerializedTemplateBlock, options: CompileOptions<Specifier>): ICompilableTemplate<ProgramSymbolTable> {
    return CompilableTemplate.topLevel(block, options);
  }

  hasHelperInScope(_helperName: string, _referer: Specifier): boolean {
    return false;
  }

  generateDataSegment() {
    return '';
  }

  resolveHelperSpecifier(_helperName: string, _referer: Specifier): Specifier {
    throw new Error("Method not implemented.");
  }

  hasModifierInScope(_modifierName: string, _referer: Specifier): boolean {
    throw new Error("Method not implemented.");
  }

  resolveModifierSpecifier(_modifierName: string, _referer: Specifier): Specifier {
    throw new Error("Method not implemented.");
  }

  hasPartialInScope(_partialName: string, _referer: Specifier): boolean {
    throw new Error("Method not implemented.");
  }

  resolvePartialSpecifier(_partialName: string, _referer: Specifier): Specifier {
    throw new Error("Method not implemented.");
  }
}
