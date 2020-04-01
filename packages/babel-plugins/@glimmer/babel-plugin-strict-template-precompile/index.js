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

          scope = t.arrowFunctionExpression([], scopePath.node);
        } else {
          scope = t.arrowFunctionExpression([], t.objectExpression([]));
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
  const compiled = precompile(templateString, precompileOptions);
  const ast = parse(`(${compiled})`);

  let metaSeen = false;

  t.traverseFast(ast, node => {
    if (t.isObjectProperty(node)) {
      if (node.key.value === 'meta') {
        metaSeen = true;
        node.value.properties.push(t.objectProperty(t.identifier('scope'), scopeNode));
      }
      if (t.isStringLiteral(node.key)) {
        node.key = t.identifier(node.key.value);
      }
    }
  });

  if (metaSeen === false) {
    ast.program.body[0].expression.properties.push(
      t.objectProperty(t.identifier('meta'), t.objectExpression([
        t.objectProperty(t.identifier('scope'), scopeNode)
      ]))
    );
  }

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
  const scope = t.arrowFunctionExpression(
    [],
    t.objectExpression(
      importIdentifiers.map(id => t.objectProperty(t.identifier(id), t.identifier(id)))
    )
  );

  let ast = _precompileTemplate(parse, templateString, scope, precompileOptions);

  return generate(ast).code;
}

module.exports.precompileTemplate = precompileTemplate;
