const { precompile } = require('@glimmer/compiler');

module.exports = function strictTemplatePrecompile(babel, options) {
  const { parse } = babel;
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
        }
      },

      CallExpression(path, state) {
        if (!state.templateImportId || path.node.callee.name !== state.templateImportId) {
          return;
        }

        if (path.node.arguments.length === 0 || path.node.arguments.length > 2) {
          throw new Error('`createTemplate()` must receive exactly one or two arguments');
        }

        const templatePath =
          path.node.arguments.length === 1 ? path.get('arguments.0') : path.get('arguments.1');

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
          const parsed = parse(`(${compiled})`);

          templatePath.replaceWith(parsed.program.body[0].expression);
        } else {
          throw new Error('createTemplate() must receive a template string');
        }
      },
    },
  };
};
