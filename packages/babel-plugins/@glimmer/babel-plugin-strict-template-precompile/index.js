const { precompile } = require('@glimmer/compiler');
const { parse } = require('@babel/parser');
const { default: generate } = require('@babel/generator');
const t = require('@babel/types');

module.exports = function strictTemplatePrecompile(babel, options) {
  const { types: t, parse } = babel;
  const { precompile: precompileOptions } = options || {};

  return {
    name: 'babel-plugin-strict-template-precompile',
    visitor: {
      ImportSpecifier(path, state) {
        if (state.templateImportId || path.parent.source.value !== '@glimmer/core') {
          return;
        }
        const importedName = path.node.imported.name;
        const localName = path.node.local.name;

        if (importedName === 'createTemplate') {
          state.templateImportId = localName;

          // remove the createTemplate named import
          if (path.parentPath.node.specifiers.length > 1) {
            path.remove();
          } else {
            path.parentPath.remove();
          }
        }
      },

      CallExpression(path, state) {
        if (!state.templateImportId || path.node.callee.name !== state.templateImportId) {
          return;
        }

        if (path.node.arguments.length === 0 || path.node.arguments.length > 2) {
          throw new Error('`createTemplate()` must receive exactly one or two arguments');
        }

        let scopePath, templatePath;

        if (path.node.arguments.length === 1) {
          templatePath = path.get('arguments.0');
        } else {
          scopePath = path.get('arguments.0');
          templatePath = path.get('arguments.1');
        }

        let scope;

        if (scopePath) {
          if (scopePath.type !== 'ObjectExpression') {
            throw new Error(
              `createTemplate() must receive an object literal with all of the imported values for the template as its scope parameter, received: ${scopePath.type}`
            );
          }

          scope = scopePath.node;
        } else {
          scope = t.objectExpression([]);
        }

        const { type } = templatePath.node;

        if (type === 'TemplateLiteral' || type === 'StringLiteral') {
          let templateString;

          if (type === 'TemplateLiteral') {
            if (templatePath.node.quasis.length > 1 || templatePath.node.expressions.length > 0) {
              throw new Error(
                'template strings passed to the `createTemplate()` function may not have any dynamic segments'
              );
            }

            templateString = templatePath.node.quasis[0].value.raw;
          } else {
            templateString = templatePath.node.value;
          }

          const ast = _precompileTemplate(parse, templateString, scope, precompileOptions);

          path.replaceWith(ast.program.body[0].expression);
        } else {
          throw new Error(`createTemplate() must receive a template string, received: ${type}`);
        }
      },
    },
  };
};

function _precompileTemplate(parse, templateString, scopeNode, precompileOptions) {
  const localsMap = scopeNode.properties.reduce((map, property) => {
    // Object keys can either be identifiers or literals
    const keyName = t.isIdentifier(property.key)
      ? property.key.name
      : property.key.value.toString();
    if (!t.isIdentifier(property.value)) {
      throw new Error(
        `Currently the babel-plugin-strict-template-precompile only supports identifiers as values for the imported values object literal. Received: ${property.value.type}`
      );
    }
    map[keyName] = property.value.name;
    return map;
  }, {});

  const compiled = precompile(templateString, {
    ...precompileOptions,
    strictMode: true,
    locals: Object.keys(localsMap),
  });
  const ast = parse(`(${compiled})`);

  t.traverseFast(ast, (node) => {
    if (
      t.isObjectProperty(node) &&
      node.key.value === 'scope' &&
      t.isArrowFunctionExpression(node.value)
    ) {
      const scopeFnNode = node.value;
      const scopeArray = scopeFnNode.body.elements;
      scopeArray.forEach((scopeElementNode) => {
        if (
          t.isIdentifier(scopeElementNode) &&
          scopeElementNode.name !== localsMap[scopeElementNode.name]
        ) {
          scopeElementNode.name = localsMap[scopeElementNode.name];
        }
      });
    }
  });

  return ast;
}

/**
 * Allows users to programmatically precompile a template given a list of import
 * identifiers and the template string. This is meant for usage in custom
 * template transforms and formats.
 *
 * @public
 * @param template string - the template to be compiled
 * @param importIdentifiers string[] - the identifiers to import
 * @param precompileOptions object - the options to be passed to the compiler
 */
function precompileTemplate(templateString, importIdentifiers = [], precompileOptions = {}) {
  const scope = t.objectExpression(
    importIdentifiers.map((id) => t.objectProperty(t.identifier(id), t.identifier(id)))
  );

  let ast = _precompileTemplate(parse, templateString, scope, precompileOptions);

  return generate(ast).code;
}
// TODO: Is this still required with the new strict mode precompile function from the vm?
module.exports.precompileTemplate = precompileTemplate;
