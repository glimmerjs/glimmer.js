import Debug from "debug";
import { relative, extname, dirname, basename } from "path";

import {
  BundleCompilationResult,
  ModuleLocatorMap,
  ExternalModuleTable,
} from "@glimmer/bundle-compiler";
import { ConstantPool, SerializedHeap } from "@glimmer/program";
import { Dict, assert, expect } from "@glimmer/util";
import { CompilableTemplate, ProgramSymbolTable, ModuleLocator, TemplateLocator as ITemplateLocator } from "@glimmer/interfaces";
import { ModuleTypes } from "@glimmer/application";
import { Project } from "glimmer-analyzer";

import { OutputFiles } from "../app-compiler-delegate";
import { TemplateMeta } from "./compiler-delegate";
import { Builtins, HelperLocator } from "../builtins";

const debug = Debug("@glimmer/compiler-delegates:mu-codegen");

export type TemplateLocator = ITemplateLocator<TemplateMeta>;
export type CompilableTemplates = ModuleLocatorMap<
  CompilableTemplate<ProgramSymbolTable>
>;

export default class MUCodeGenerator {
  constructor(
    protected project: Project,
    protected outputFiles: OutputFiles,
    protected builtins: Builtins,
    protected compilation: BundleCompilationResult,
    protected mainTemplateLocator: ModuleLocator
  ) {}

  generateDataSegment() {
    debug("generating data segment");
    let { mainTemplateLocator } = this;
    let { heap, pool, table } = this.compilation;

    let externalModuleTable = this.generateExternalModuleTable(table);
    let constantPool = this.generateConstantPool(pool);
    let heapTable = this.generateHeap(heap);
    let meta = this.generateTemplateMetadata(table, this.compilation.symbolTables);
    let main = table.vmHandleByModuleLocator.get(mainTemplateLocator);

    expect(main, `Could not find handle for ${JSON.stringify(mainTemplateLocator)}.`);

    let source = strip`
      ${externalModuleTable}
      ${heapTable}
      ${constantPool}
      ${meta}
      const mainEntry = ${main.toString()};
      export default { table, heap, pool, meta, mainEntry, prefix };`;
    debug("generated data segment; source=%s", source);

    return source;
  }

  generateTemplateMetadata(table: ExternalModuleTable, compilerSymbolTables: ModuleLocatorMap<ProgramSymbolTable>) {
    let symbolTables = this.generateSymbolTables(compilerSymbolTables);
    let map = this.generateSpecifierMap(table);

    // Get the union of specifiers contained in the symbol tables and specifier
    // map.
    let specifiers = Array.from(new Set([
      ...Object.keys(map),
      ...Object.keys(symbolTables)
    ]));

    let commonPrefix = this.commonPrefix(specifiers);
    let prefix = `const prefix = "${commonPrefix}";`;
    let meta = {};

    specifiers.forEach(specifier => {
      let trimmed = specifier.replace(commonPrefix, '');

      let [vmHandle, handle] = map[specifier] || [null, null];
      let table = symbolTables[specifier];

      meta[trimmed] = removeEmpty({
        v: vmHandle,
        h: handle,
        table
      });
    });

    return `${prefix} const meta = ${inlineJSON(meta)};`;
  }

  generateSymbolTables(compilerSymbolTables: ModuleLocatorMap<ProgramSymbolTable>) {
    let symbolTables: Dict<ProgramSymbolTable> = {};

    compilerSymbolTables.forEach((symbolTable, locator) => {
      let specifier;
      if (locator.name === 'mainTemplate') {
        specifier = 'mainTemplate';
      } else {
        specifier = this.project.specifierForPath(relativePath(locator.module));
      }

      let { hasEval, symbols } = symbolTable;

      // We cast this as `any` before assignment, because symbol tables require
      // a `referrer` but we're omitting it here because it will always be null
      // for top-level symbol tables. Rather than serializing a redundant field
      // for every symbol table for every template in the system, we can fill
      // this in at runtime on the client.
      symbolTables[specifier] = { hasEval: +hasEval, symbols } as any;
    });

    return symbolTables;
  }

  private commonPrefix(strings: string[]) {
    let first = strings[0];
    let commonLength = first.length;

    for (let i = 0; i < strings.length; ++i) {
      for (let j = 0; j < commonLength; ++j) {
        if (strings[i].charAt(j) !== first.charAt(j)) {
          commonLength = j;
          break;
        }
      }
    }

    return first.slice(0, commonLength);
  }

  generateSpecifierMap(table: ExternalModuleTable) {
    let map: Dict<number[]> = {};

    table.vmHandleByModuleLocator.forEach((vmHandle, locator) => {
      let specifier = this.project.specifierForPath(relativePath(locator.module));
      if (specifier) {
        map[specifier] = [vmHandle];
        map[specifier].push(table.byModuleLocator.get(locator));
      }
    });

    return map;
  }

  generateHeap(heap: SerializedHeap) {
    assert((heap.table.length / 2) % 1 === 0, 'Heap table should be balanced and divisible by 2');
    let serializedHeap = { table: heap.table, handle: heap.handle };
    return strip`
      const heap = ${inlineJSON(serializedHeap)};
    `;
  }

  generateConstantPool(pool: ConstantPool) {
    return strip`
      const pool = ${inlineJSON(pool)};
    `;
  }

  generateExternalModuleTable(table: ExternalModuleTable) {
    let { project } = this;
    let dataSegmentPath = dirname(this.outputFiles.dataSegment);

    // First, create an array using a module's assigned handles as the index.
    // This allows for fast lookup in the client. E.g. two modules with handles
    // 0 and 2 respectively would produce [Module1,,Module2].
    let modules = toSparseArray(table.byHandle)
      // Next, replace templates with their corresponding component classes, so
      // `src/ui/components/Profile/template.hbs` becomes
      // `src/ui/components/Profile/component`.
      .map(replaceTemplatesWithComponents)
      .map(normalizeModulePaths);

    let source = generateExternalModuleTable(modules, this.builtins);

    return source;

    function replaceTemplatesWithComponents(locator) {
      let referrer = project.specifierForPath(locator.module.replace(/^\.\//, ''));
      if (referrer && referrer.split(':')[0] === 'template') {
        let specifier = project.resolver.identify("component:", referrer);
        if (!specifier) {
          debug("no component for template; referrer=%s", referrer);
          return null;
        }

        let module = `./${project.pathForSpecifier(specifier)}`;

        debug(
          "found corresponding component; path=%s; specifier=%s; referrer=%s;",
          module,
          specifier,
          referrer
        );

        return { module, name: "default" };
      } else if (locator.kind === 'template') {
        return null;
      }

      return locator;
    }

    // Turn module paths into paths relative to where they'll be imported from.
    // For example, if a module has a path of `src/ui/components/User/component`
    // and the data segment path is `compiled/data/table`, we want to generate a
    // path like `../../src/ui/components/User/component`.
    function normalizeModulePaths(locator: ModuleLocator) {
      if (!locator) { return null; }

      let { module, name } = locator;

      // Don't try to normalize imports from packages
      if (!module.match(/^(\.|\.\.)?\//)) {
        debug("skipping module path normalization; path=%s", module);
        return locator;
      }

      let relativePath = relative(dataSegmentPath, module);
      relativePath = relativePath.replace(extname(relativePath), "");
      relativePath = `./${relativePath}`;

      debug(
        "normalizing module path; from=%s; to=%s; path=%s",
        module,
        dataSegmentPath,
        relativePath
      );

      return {...locator, module: relativePath, name };
    }
  }
}

function isHelperLocator(
  locator: ModuleLocator
): locator is HelperLocator {
  return (locator as HelperLocator).kind === 'helper';
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

function relativePath(path: string) {
  return path.replace(/^\.\//, '');
}

function generateExternalModuleTable(
  modules: ModuleLocator[],
  builtins: Builtins
) {
  let { imports, identifiers } = getImportStatements(modules);
  identifiers = identifiers.map((id, handle) => {
    let locator = modules[handle];
    if (locator && isHelperLocator(locator)) {
      let type = locator.meta.factory ? ModuleTypes.HELPER_FACTORY : ModuleTypes.HELPER;
      return `[${type}, ${id}]`;
    }
    return id;
  });

  return `
${imports.join("\n")}
const table = [${identifiers.join(",")}];
`;
}

function strip(strings: TemplateStringsArray, ...args: string[]) {
  if (typeof strings === "object") {
    return strings
      .map((str: string, i: number) => {
        return `${str
          .split("\n")
          .map(s => s.trim())
          .join("")}${args[i] ? args[i] : ""}`;
      })
      .join("");
  } else {
    return strings[0]
      .split("\n")
      .map((s: string) => s.trim())
      .join(" ");
  }
}

/**
* Generates a valid JavaScript identifier for a module path. Can optionally take
* a dictionary of already-seen identifiers to avoid naming collisions.
*
* @param {string} modulePath the module path
* @param {object} seen an object containing already-seen identifiers as keys
* @returns {string} identifier a valid JavaScript identifier
*/
export function getIdentifier(locator: ModuleLocator, handle: number) {
  let name = getMeaningfulName(locator);
  let identifier = name
    // replace any non-letter, non-number, non-underscore
    .replace(/[\W]/g, '_');

  return `${identifier}_${handle.toString()}`;
}

/**
 * Returns a meaningful name for a given export. This is the name of the export
 * for named exports, or the basename of the module path for default exports.
 */
function getMeaningfulName(locator: ModuleLocator) {
  return locator.name === 'default' ?
    basename(locator.module) :
    locator.name;
}

/**
 * Generates the import clause of an import statement based on both the export
 * name and the desired local identifier.
 *
 *     getImportClause('default', 'MyClass') => 'MyClass'
 *     getImportClause('MyClass', 'MyClass') => '{ MyClass }'
 *     getImportClause('MyClass', 'GlimmerMyClass') => '{ MyClass as GlimmerMyClass }'
 */
export function getImportClause(name: string, id: string) {
  if (name === 'default') { return id; }
  if (name === 'id') { return `{ ${id} }`; }
  return `{ ${name} as ${id} }`;
}

export function getImportStatement(specifier: ModuleLocator, id: string) {
  let { module, name } = specifier;

  let importClause = getImportClause(name, id);
  let moduleSpecifier = getModuleSpecifier(module);

    return `import ${importClause} from ${moduleSpecifier};`;
}

export function getModuleSpecifier(modulePath: string) {
  return JSON.stringify(modulePath);
}

/**
 * Given an array of module locators, returns a list of import statements as well
 * as the unique identifiers generated for each one.
 *
 * For example, given the following array of modules:
 *
 *   [{ module: 'UserProfile', name: 'default' },
 *    { module: 'DatePicker', name: 'default' },
 *    { module: 'helpers', name: 'translate' }]
 *
 * It will produce an array of import statements:
 *
 *   ['import UserProfile_0 from 'UserProfile',
 *    'import DatePicker_1 from 'DatePicker',
 *    'import { translate as translate_2 } from 'helpers']
 *
 * As well as the unique identifiers generated in those import statements:
 *
 *   ['UserProfile_0', 'DatePicker_1', 'translate_2']
 */
export function getImportStatements(modules: ModuleLocator[]) {
  let identifiers = new Array<string>(modules.length).fill('');

  let imports = modules.map((locator, handle) => {
    // Null values indicate a module that has been assigned a handle but should
    // not be included in the module table. Instead, we'll leave a comment that
    // helps debuggability and leaves a "hole" in the array so handles are still
    // valid indices.
    if (!locator) {
      identifiers[handle] = `/* ${handle} */`;
      return '';
    }

    let id = getIdentifier(locator, handle);
    identifiers[handle] = id;

    return getImportStatement(locator, id);
  });

  return { imports, identifiers };
}

/**
 * To keep file size down, we can eliminate null and undefined values.
 */
function removeEmpty(obj) {
  let trimmed = {};

  for (let key in obj) {
    if (obj[key] !== undefined) {
      trimmed[key] = obj[key];
    }
  }

  return trimmed;
}