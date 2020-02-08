const { precompile } = require('@glimmer/compiler');

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

          const compiled = precompile(templateString, precompileOptions);
          const ast = parse(`(${compiled})`);

          t.traverseFast(ast, node => {
            if (t.isObjectProperty(node)) {
              if (node.key.value === 'meta') {
                node.value.properties.push(t.objectProperty(t.identifier('scope'), scope));
              }
              if (t.isStringLiteral(node.key)) {
                node.key = t.identifier(node.key.value);
              }
            }
          });

          path.replaceWith(ast.program.body[0].expression);
        } else {
          throw new Error(`createTemplate() must receive a template string, received: ${type}`);
        }
      },
    },
  };
};
