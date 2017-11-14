import { BundleCompilationResult, ExternalModuleTable, ModuleLocatorMap } from "@glimmer/bundle-compiler";
import { Opaque, ProgramSymbolTable, Dict } from "@glimmer/interfaces";
import { assert } from "@glimmer/util";
import { SerializedHeap, ConstantPool } from "@glimmer/program";

export abstract class CodeGenerator {
  constructor(protected compilation: BundleCompilationResult) {}
  abstract generateExternalModuleTable(table: ExternalModuleTable): {code: string, table: Opaque[] }
  generateDataSegment() {
    let { heap, pool, table } = this.compilation;

    let externalModuleTable = this.generateExternalModuleTable(table);
    let constantPool = this.generateConstantPool(pool);
    let heapTable = this.generateHeap(heap);
    let specifierMap = this.generateSpecifierMap(table);
    let symbolTables = this.generateSymbolTables(this.compilation.symbolTables);

    let source = strip`
      ${externalModuleTable.code}
      ${heapTable.code}
      ${constantPool.code}
      ${specifierMap.code}
      ${symbolTables.code}
      export default { table, heap, pool, map, symbols };`;

    return {
      code: source,
      data: {
        table: externalModuleTable.table,
        heap: heapTable.heap,
        pool: constantPool.pool,
        map: specifierMap.map,
        symbols: symbolTables.symbolTables
      }
    };
  }

  specifierForPath(path: string) {
    return path;
  }

  generateSymbolTables(compilerSymbolTables: ModuleLocatorMap<ProgramSymbolTable>) {
    let symbolTables: Dict<ProgramSymbolTable> = {};

    compilerSymbolTables.forEach((symbolTable, locator) => {
      let specifier;
      if (locator.name === 'mainTemplate') {
        specifier = 'mainTemplate';
      } else {
        specifier = this.specifierForPath(relativePath(locator.module));
      }

      let { hasEval, symbols } = symbolTable;

      // We cast this as `any` before assignment, because symbol tables require
      // a `referrer` but we're omitting it here because it will always be null
      // for top-level symbol tables. Rather than serializing a redundant field
      // for every symbol table for every template in the system, we can fill
      // this in at runtime on the client.
      symbolTables[specifier] = { hasEval, symbols } as any;
    });

    let code = `const symbols = ${inlineJSON(symbolTables)};`;

    return {
      code,
      symbolTables
    };
  }

  generateSpecifierMap(table: ExternalModuleTable) {
    let map: Dict<number> = {};

    table.vmHandleByModuleLocator.forEach((handle, locator) => {
      let specifier = this.specifierForPath(relativePath(locator.module));
      if (specifier) { map[specifier] = handle; }
    });

    let code = `const map = ${inlineJSON(map)};`;

    return {
      code,
      map
    };
  }

  generateHeap(heap: SerializedHeap) {
    assert((heap.table.length / 2) % 1 === 0, 'Heap table should be balanced and divisible by 2');
    let serializedHeap = { table: heap.table, handle: heap.handle };
    let code = strip`
      const heap = ${inlineJSON(serializedHeap)};
    `;

    return { code, heap: serializedHeap };
  }

  generateConstantPool(pool: ConstantPool) {
    const code = `const pool = ${inlineJSON(pool)};`;
    return {
      code,
      pool
    };
  }
}

function inlineJSON(data: any) {
  return `JSON.parse(${JSON.stringify(JSON.stringify(data))})`;
}

function relativePath(path: string) {
  return path.replace(/^\.\//, '');
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
