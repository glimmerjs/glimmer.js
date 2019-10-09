import { BundleCompilationResult } from '@glimmer/bundle-compiler';
import {
  SymbolTable,
  ComponentCapabilities,
  ModuleLocator,
  TemplateLocator,
} from '@glimmer/interfaces';
import { expect } from '@glimmer/util';
import { relative } from 'path';
import Debug from 'debug';
import { Project } from 'glimmer-analyzer';

import { AppCompilerDelegateOptions, OutputFiles } from '../app-compiler-delegate';
import { Builtins, HelperLocator } from '../builtins';
import MUCodeGenerator from './code-generator';
import { AppCompilerDelegate, CUSTOM_COMPONENT_CAPABILITIES } from '@glimmer/application';

const debug = Debug('@glimmer/compiler-delegates:mu-delegate');

export interface TemplateMeta {
  specifier: string;
}

export default class MUCompilerDelegate implements AppCompilerDelegate<ModuleLocator> {
  public projectPath: string;
  public outputFiles: OutputFiles;

  protected project: Project;
  protected specifiersToSymbolTable: Map<ModuleLocator, SymbolTable> = new Map();
  protected builtins: Builtins;
  protected mainTemplateLocator: ModuleLocator;

  constructor({
    mainTemplateLocator,
    projectPath,
    outputFiles,
    builtins = {},
  }: AppCompilerDelegateOptions) {
    debug('initialized MU compiler delegate; project=%s', projectPath);
    this.outputFiles = outputFiles;
    this.projectPath = projectPath;
    this.project = new Project(projectPath);
    this.mainTemplateLocator = mainTemplateLocator || {
      module: '@glimmer/application',
      name: 'mainLayout',
    };

    this.builtins = {
      ...this._builtins(),
      ...builtins,
    };
  }

  protected _builtins() {
    let mainTemplate = this.templateLocatorFor({
      module: '@glimmer/application',
      name: 'mainTemplate',
    });
    return {
      mainTemplate,
      if: helperLocatorFor('@glimmer/application', 'ifHelper'),
      action: helperLocatorFor('@glimmer/application', 'actionHelper', true),
    };
  }

  relativePath(module: string): string {
    return module.replace(/^\.\//, '');
  }

  /**
   * Converts absolute module paths into paths relative to the project root.
   */
  normalizePath(modulePath: string): string {
    let projectDir = this.project.projectDir;
    let relativePath = relative(projectDir, modulePath);

    return `./${relativePath}`;
  }

  getSpecifier(locator: ModuleLocator): string {
    const relativePath = this.relativePath(locator.module);

    return this.project.pathMap[relativePath];
  }

  /**
   * Annotates the template locator with the Module Unification specifier
   * string.
   */
  templateLocatorFor({ module, name }: ModuleLocator): TemplateLocator<ModuleLocator> {
    let relativePath = this.relativePath(module);

    let meta;
    if (this._builtins[name]) {
      meta = { specifier: name };
    } else {
      meta = {
        specifier: this.project.specifierForPath(relativePath),
      };
    }

    return { kind: 'template', module, name, meta };
  }

  generateDataSegment(compilation: BundleCompilationResult): string {
    let { project, builtins, outputFiles, mainTemplateLocator } = this;
    let codegen = new MUCodeGenerator(
      project,
      outputFiles,
      builtins,
      compilation,
      mainTemplateLocator
    );
    return codegen.generateDataSegment();
  }

  hasComponentInScope(name: string, referrer: ModuleLocator): boolean {
    debug('hasComponentInScope; name=%s; referrer=%o', name, referrer);

    const referrerSpecifier = this.getSpecifier(referrer);

    return !!this.project.resolver.identify(`template:${name}`, referrerSpecifier);
  }

  resolveComponent(name: string, referrer: ModuleLocator): ModuleLocator {
    const referrerSpecifier = this.getSpecifier(referrer);

    let specifier = this.project.resolver.identify(`template:${name}`, referrerSpecifier);
    return this.moduleLocatorFor(specifier);
  }

  getComponentCapabilities(): ComponentCapabilities {
    return CUSTOM_COMPONENT_CAPABILITIES;
  }

  hasHelperInScope(helperName: string, referrer: ModuleLocator) {
    if (helperName in this.builtins) {
      return true;
    }

    const referrerSpecifier = this.getSpecifier(referrer);

    return !!this.project.resolver.identify(`helper:${helperName}`, referrerSpecifier);
  }

  resolveHelper(helperName: string, referrer: ModuleLocator) {
    if (helperName in this.builtins) {
      return this.builtins[helperName];
    }

    const referrerSpecifier = this.getSpecifier(referrer);

    let specifier = this.project.resolver.identify(`helper:${helperName}`, referrerSpecifier);
    let module = `./${this.project.pathForSpecifier(specifier)}`;
    return helperLocatorFor(module, 'default');
  }

  protected moduleLocatorFor(specifier: string): ModuleLocator {
    let module = expect(
      this.project.pathForSpecifier(specifier),
      `couldn't find module with specifier '${specifier}'`
    );
    module = `./${module}`;

    return { module, name: 'default' };
  }

  hasModifierInScope(_modifierName: string, _referrer: ModuleLocator): boolean {
    return false;
  }

  resolveModifier(_modifierName: string, _referrer: ModuleLocator): ModuleLocator {
    throw new Error('Method not implemented.');
  }
  hasPartialInScope(_partialName: string, _referrer: ModuleLocator): boolean {
    return false;
  }
  resolvePartial(_partialName: string, _referrer: ModuleLocator): ModuleLocator {
    throw new Error('Method not implemented.');
  }
}

function helperLocatorFor(module: string, name: string, factory = false): HelperLocator {
  return {
    kind: 'helper',
    module,
    name,
    meta: {
      factory,
    },
  };
}
