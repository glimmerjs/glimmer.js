import { ModuleLocator, TemplateLocator, BundleCompilationResult } from '@glimmer/bundle-compiler';
import { SymbolTable, ProgramSymbolTable, ComponentCapabilities } from '@glimmer/interfaces';
import { expect } from '@glimmer/util';
import { relative } from 'path';
import { SerializedTemplateBlock } from '@glimmer/wire-format';
import { CompilableTemplate, CompileOptions, ICompilableTemplate } from '@glimmer/opcode-compiler';
import Debug from 'debug';
import { Project } from 'glimmer-analyzer';
import { CAPABILITIES } from '@glimmer/component';

import AppCompilerDelegate, { AppCompilerDelegateOptions, OutputFiles } from '../app-compiler-delegate';
import { Builtins, HelperLocator } from '../builtins';
import MUCodeGenerator from './code-generator';

const debug = Debug('@glimmer/compiler-delegates:mu-delegate');

export interface TemplateMeta {
  specifier: string;
}

export default class MUCompilerDelegate implements AppCompilerDelegate<TemplateMeta> {
  public projectPath: string;
  public outputFiles: OutputFiles;

  protected project: Project;
  protected specifiersToSymbolTable: Map<ModuleLocator, SymbolTable> = new Map();
  protected builtins: Builtins;

  constructor({ projectPath, outputFiles, builtins = {} }: AppCompilerDelegateOptions) {
    debug('initialized MU compiler delegate; project=%s', projectPath);
    this.outputFiles = outputFiles;
    this.projectPath = projectPath;
    this.project = new Project(projectPath);

    this.builtins = {
      ...this._builtins(),
      ...builtins
    };
  }

  protected _builtins() {
    let mainLocator = this.templateLocatorFor({
      module: '@glimmer/application',
      name: 'mainTemplate'
    });
    return {
      mainTemplate: mainLocator,
      if: helperLocatorFor('@glimmer/application', 'ifHelper'),
      action: helperLocatorFor('@glimmer/application', 'actionHelper')
    };
  }

  /**
   * Converts absolute module paths into paths relative to the project root.
   */
  normalizePath(modulePath: string): string {
    let projectDir = this.project.projectDir;
    let relativePath = relative(projectDir, modulePath);

    return `./${relativePath}`;
  }

  /**
   * Annotates the template locator with the Module Unification specifier
   * string.
   */
  templateLocatorFor({ module, name }: ModuleLocator): TemplateLocator<TemplateMeta> {
    let relativePath = module.replace(/^\.\//, '');

    let meta;
    if (this._builtins[name]) {
      meta = { specifier: name };
    } else {
      meta = {
        specifier: this.project.specifierForPath(relativePath)
      };
    }

    return { kind: 'template', module, name, meta };
  }

  generateDataSegment(compilation: BundleCompilationResult): string {
    let { project, builtins, outputFiles } = this;
    let codegen = new MUCodeGenerator(project, outputFiles, builtins, compilation);
    return codegen.generateDataSegment();
  }

  hasComponentInScope(name: string, referrer: TemplateMeta): boolean {
    debug('hasComponentInScope; name=%s; referrer=%o', name, referrer);

    return !!this.project.resolver.identify(`template:${name}`, referrer.specifier);
  }

  resolveComponent(name: string, referrer: TemplateMeta): ModuleLocator {
    let specifier = this.project.resolver.identify(`template:${name}`, referrer.specifier);
    return this.moduleLocatorFor(specifier);
  }

  getComponentCapabilities(): ComponentCapabilities {
    return CAPABILITIES;
  }

  hasHelperInScope(helperName: string, referrer: TemplateMeta) {
    if (helperName in this.builtins) { return true; }
    return !!this.project.resolver.identify(`helper:${helperName}`, referrer.specifier);
  }

  resolveHelper(helperName: string, referrer: TemplateMeta) {
    if (helperName in this.builtins) { return this.builtins[helperName]; }

    let specifier = this.project.resolver.identify(`helper:${helperName}`, referrer.specifier);
    return this.moduleLocatorFor(specifier);
  }

  getComponentLayout(_meta: TemplateMeta, block: SerializedTemplateBlock, options: CompileOptions<TemplateMeta>): ICompilableTemplate<ProgramSymbolTable> {
    return CompilableTemplate.topLevel(block, options);
  }

  protected moduleLocatorFor(specifier: string): ModuleLocator {
    let module = expect(this.project.pathForSpecifier(specifier), `couldn't find module with specifier '${specifier}'`);
    module = `./${module}`;

    return { module, name: 'default' };
  }

  hasModifierInScope(_modifierName: string, _referrer: TemplateMeta): boolean {
    return false;
  }

  resolveModifier(_modifierName: string, _referrer: TemplateMeta): ModuleLocator {
    throw new Error("Method not implemented.");
  }
  hasPartialInScope(_partialName: string, _referrer: TemplateMeta): boolean {
    return false;
  }
  resolvePartial(_partialName: string, _referrer: TemplateMeta): ModuleLocator {
    throw new Error("Method not implemented.");
  }
}

function helperLocatorFor(module: string, name: string, factory = true): HelperLocator {
  return {
    kind: 'helper',
    module,
    name,
    meta: {
      factory
    }
  };
}
