import { Specifier } from "@glimmer/bundle-compiler";
import { dict, Dict } from "@glimmer/util";

/**
* Generates a valid JavaScript identifier for a module path. Can optionally take
* a dictionary of already-seen identifiers to avoid naming collisions.
*
* @param {string} modulePath the module path
* @param {object} seen an object containing already-seen identifiers as keys
* @returns {string} identifier a valid JavaScript identifier
*/
export function getIdentifier(modulePath: string, seen: Dict<boolean> = {}) {
  let identifier = modulePath
    // replace any non letter, non-number, non-underscore
    .replace(/[\W]/g, '_');

  // if we have already generated this identifier
  // prefix with an _ until we find a unique one
  while (identifier in seen) {
    identifier = `_${identifier}`;
  }

  seen[identifier] = true;

  return `__${identifier}__`;
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

export function getImportStatement(specifier: Specifier, id: string) {
  let { module, name } = specifier;

  let importClause = getImportClause(name, id);
  let moduleSpecifier = getModuleSpecifier(module);

    return `import ${importClause} from ${moduleSpecifier};`;
}

export function getModuleSpecifier(modulePath: string) {
  return JSON.stringify(`./${modulePath}`);
}

export function getImportStatements(modules: Specifier[]) {
  let identifiers = new Array<string>(modules.length).fill('');
  let seen = dict<boolean>();

  let imports = modules.map((specifier, i) => {
    let { module } = specifier;
    let id = getIdentifier(module, seen);
    identifiers[i] = id;

    return getImportStatement(specifier, id);
  });

  return { imports, identifiers };
}
