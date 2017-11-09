import { BundleCompilerDelegate, AddedTemplate, Builtins, BuiltinsMap, Name, ModulePath, Identifier } from '../bundle';
import { getImportStatements, OutputFiles } from '../utils/code-gen';
import { BundleCompiler, Specifier, specifierFor, SpecifierMap } from '@glimmer/bundle-compiler';
import { SymbolTable, ProgramSymbolTable, ComponentCapabilities } from '@glimmer/interfaces';
import { expect, Dict } from '@glimmer/util';
import { relative, extname, dirname } from 'path';
import { SerializedTemplateBlock } from '@glimmer/wire-format';
import { CompilableTemplate, CompileOptions, ICompilableTemplate } from '@glimmer/opcode-compiler';
import { ConstantPool } from '@glimmer/program';
import * as Debug from 'debug';
import { Project } from 'glimmer-analyzer';
import { CAPABILITIES } from '@glimmer/component';

const debug = Debug('@glimmer/compiler-delegates:mu-delegate');

export default class ModuleUnificationCompilerDelegate implements BundleCompilerDelegate {
  public bundleCompiler: BundleCompiler;
  protected project: Project;
  protected specifiersToSymbolTable: Map<Specifier, SymbolTable> = new Map();
  private builtinsMap: BuiltinsMap;

  constructor(protected projectPath: string, public outputFiles: OutputFiles, envBuiltIns: Builtins = {}) {
    debug('initialized MU compiler delegate; project=%s', projectPath);
    this.project = new Project(projectPath);
    let builtins: {
      [key: string]: any
    } = {
      main: specifierFor('main', 'mainTemplate'),
      if: specifierFor('@glimmer/application', 'ifHelper'),
      action: specifierFor('@glimmer/application', 'actionHelper'),
      ...envBuiltIns
    };

    let byName = new Map<Name, ModulePath>();
    let byModulePath = new Map<ModulePath, Name>();
    let byIdentifier = new Map<Identifier, Specifier>();

    Object.keys(builtins).forEach(builtin => {
      let specifier = builtins[builtin];
      byName.set(specifier.name, specifier.module);
      byModulePath.set(specifier.module, specifier.name);
      byIdentifier.set(builtin, specifier);
    });

    this.builtinsMap = {
      byModulePath,
      byName,
      byIdentifier
    };
  }

  hasComponentInScope(name: string, referrer: Specifier) {
    debug('hasComponentInScope; name=%s; referrer=%o', name, referrer);

    let referrerSpec = expect(
      this.project.specifierForPath(referrer.module),
      `The component <${name}> was used in ${referrer.module} but could not be found.`
    );

    return !!this.project.resolver.identify(`template:${name}`, referrerSpec);
  }

  resolveComponentSpecifier(name: string, referrer: Specifier) {
    let referrerSpec = expect(this.project.specifierForPath(referrer.module), `expected specifier for path ${referrer.module}`);
    let resolved = this.project.resolver.identify(`template:${name}`, referrerSpec);

    let resolvedSpecifier = this.getCompilerSpecifier(resolved);
    return resolvedSpecifier;
  }

  specifierFor(relativePath: string) {
    return specifierFor(relativePath, 'default');
  }

  /**
   * Converts a path relative to the current working directory into a path
   * relative to the project root.
   */
  normalizePath(modulePath: string): string {
    let project = this.project;
    let projectPath = relative(process.cwd(), project.projectDir);

    return relative(projectPath, modulePath);
  }

  protected getCompilerSpecifier(specifier: string): Specifier {
    let modulePath = expect(this.project.pathForSpecifier(specifier), `couldn't find module with specifier '${specifier}'`);

    return specifierFor(modulePath, 'default');
  }

  getComponentCapabilities(): ComponentCapabilities {
    return CAPABILITIES;
  }

  hasHelperInScope(helperName: string, referrer: Specifier) {
    if (this.builtinsMap.byIdentifier.has(helperName)) { return true; }

    let referrerSpec = this.project.specifierForPath(referrer.module) || undefined;
    return !!this.project.resolver.identify(`helper:${helperName}`, referrerSpec);
  }

  resolveHelperSpecifier(helperName: string, referrer: Specifier) {
    if (this.builtinsMap.byIdentifier.has(helperName)) {
      return this.builtinsMap.byIdentifier.get(helperName);
    }

    let referrerSpec = this.project.specifierForPath(referrer.module) || undefined;
    let resolvedSpec = this.project.resolver.identify(`helper:${helperName}`, referrerSpec);

    return this.getCompilerSpecifier(resolvedSpec);
  }

  getComponentLayout(_specifier: Specifier, block: SerializedTemplateBlock, options: CompileOptions<Specifier>): ICompilableTemplate<ProgramSymbolTable> {
    return CompilableTemplate.topLevel(block, options);
  }

  generateDataSegment(map: SpecifierMap, pool: ConstantPool, table: number[], nextFreeHandle: number, compiledBlocks: Map<Specifier, AddedTemplate>) {
    debug('generating data segment');

    let externalModuleTable = this.generateExternalModuleTable(map);
    let constantPool = this.generateConstantPool(pool);
    let heapTable = this.generateHeapTable(table);
    let specifierMap = this.generateSpecifierMap(map);
    let symbolTables = this.generateSymbolTables(compiledBlocks);

    let source = strip`
      ${externalModuleTable}
      ${heapTable}
      ${constantPool}
      ${specifierMap}
      ${symbolTables}
      export default { moduleTable, heapTable, pool, specifierMap, symbolTables };`;
    debug('generated data segment; source=%s', source);

    return source;
  }

  generateSymbolTables(compiledBlocks: Map<Specifier, AddedTemplate>) {
    let symbolTables: Dict<ProgramSymbolTable> = {};

    for (let [specifier, template ] of compiledBlocks) {
      if (!(this.builtinsMap.byName.has(specifier.name))) {
        let muSpecifier = this.muSpecifierForSpecifier(specifier);

        symbolTables[muSpecifier] = {
          hasEval: (template as SerializedTemplateBlock).hasEval,
          symbols: (template as SerializedTemplateBlock).symbols,
          referrer: null
        };
      }
    }

    return `const symbolTables = ${inlineJSON(symbolTables)};`;
  }

  generateSpecifierMap(map: SpecifierMap) {
    let entries = Array.from(map.vmHandleBySpecifier.entries());
    let specifierMap: Dict<number> = {};

    for (let [specifier, handle] of entries) {
      if (!(this.builtinsMap.byName.has(specifier.name))) {
        let muSpecifier = this.muSpecifierForSpecifier(specifier);
        specifierMap[muSpecifier] = handle;
      }
    }

    return `const specifierMap = ${inlineJSON(specifierMap)};`;
  }

  muSpecifierForSpecifier(specifier: Specifier): string {
    let project = this.project;

    return expect(
      project.specifierForPath(specifier.module),
      `expected to have a MU specifier for module ${specifier.module}`
    );
  }

  generateHeapTable(table: number[]) {
    return strip`
      const heapTable = ${inlineJSON(table)};
    `;
  }

  generateConstantPool(pool: ConstantPool) {
    return strip`
      const pool = ${inlineJSON(pool)};
    `;
  }

  generateExternalModuleTable(map: SpecifierMap) {
    let project = this.project;
    let self = this;
    let dataSegmentPath = dirname(this.outputFiles.dataSegment);

    // First, convert the map into an array of specifiers, using the handle
    // as the index.
    let modules = toSparseArray(map.byHandle)
      .map(normalizeModulePaths)
      .filter(m => m) as Specifier[];

    let source = generateExternalModuleTable(modules, this.builtinsMap);

    return source;

    function normalizeModulePaths(moduleSpecifier: Specifier) {
      if (self.builtinsMap.byName.has(moduleSpecifier.name)) {
        return moduleSpecifier;
      } else {
        let specifier = self.muSpecifierForSpecifier(moduleSpecifier);

        debug('resolved MU specifier; specifier=%s', specifier);

        let [type] = specifier.split(':');

        switch (type) {
          case 'template':
            return getComponentImport(specifier);
          case 'helper':
            return moduleSpecifier;
          default:
            throw new Error(`Unsupported type in specifier map: ${type}`);
        }
      }
    }

    function getComponentImport(referrer: string): Specifier | null {
      let componentSpec = project.resolver.identify('component:', referrer);
      if (componentSpec) {
        let componentPath = project.pathForSpecifier(componentSpec)!;
        componentPath = relative(dataSegmentPath, componentPath);
        debug('found corresponding component; referrer=%s; path=%s; dataSegment=%s', referrer, componentPath, dataSegmentPath);
        componentPath = componentPath.replace(extname(componentPath), '');

        return specifierFor(componentPath, 'default');
      }

      debug('no component for template; referrer=%s', referrer);
      return null;
    }
  }

  hasModifierInScope(_modifierName: string, _referrer: Specifier): boolean {
    return false;
  }
  resolveModifierSpecifier(_modifierName: string, _referrer: Specifier): Specifier {
    throw new Error("Method not implemented.");
  }
  hasPartialInScope(_partialName: string, _referrer: Specifier): boolean {
    return false;
  }
  resolvePartialSpecifier(_partialName: string, _referrer: Specifier): Specifier {
    throw new Error("Method not implemented.");
  }
}

function inlineJSON(data: any) {
  return `JSON.parse(${JSON.stringify(JSON.stringify(data))})`;
}

function toSparseArray<T>(map: Map<number, T>): T[] {
  let array: T[] = [];

  for (let [key, value] of map) {
    array[key] = value;
  }

  return array;
}

function generateExternalModuleTable(modules: Specifier[], builtins: BuiltinsMap) {
  let { imports, identifiers } = getImportStatements(modules, builtins);

  return `
${imports.join('\n')}
const moduleTable = [${identifiers.join(',')}];
`;
}

function strip(strings: TemplateStringsArray, ...args: string[]) {
  if (typeof strings === 'object') {
    return strings.map((str: string, i: number) => {
      return `${str.split('\n').map(s => s.trim()).join('')}${args[i] ? args[i] : ''}`;
    }).join('');
  } else {
    return (strings as any)[0].split('\n').map((s: string) => s.trim()).join(' ');
  }
}
