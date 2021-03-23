const generateVmPlugins = require('@glimmer/vm-babel-plugins');

function defaultTo(value, defaultVal) {
  return value === undefined ? defaultVal : value;
}

module.exports = function (api, options) {
  let isDebug = defaultTo(options.isDebug, api.environment ? !api.environment('production') : true);
  let __customInlineTemplateModules = defaultTo(options.__customInlineTemplateModules, {});

  return {
    plugins: [
      ...generateVmPlugins({ isDebug }),

      [
        require.resolve('babel-plugin-debug-macros'),
        {
          debugTools: {
            source: '@glimmer/debug',
            isDebug,
          },
          externalizeHelpers: {
            module: true,
          },
        },
        'glimmer-debug-macros',
      ],

      [
        require.resolve('babel-plugin-htmlbars-inline-precompile'),
        {
          templateCompilerPath: require.resolve('@glimmer/compiler'),
          isProduction: !isDebug,
          ensureModuleApiPolyfill: false,
          moduleOverrides: {
            '@ember/component/template-only': {
              default: ['templateOnlyComponent', '@glimmer/core'],
            },
            '@ember/template-factory': {
              createTemplateFactory: ['createTemplateFactory', '@glimmer/core'],
            },
            '@ember/component': {
              setComponentTemplate: ['setComponentTemplate', '@glimmer/core'],
            },
          },
          modules: {
            ...__customInlineTemplateModules,
            '@glimmer/core': {
              export: 'precompileTemplate',
              disableTemplateLiteral: true,
              shouldParseScope: true,
            },
          },
        },
        'glimmer-inline-precompile',
      ],

      [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
      require.resolve('@babel/plugin-proposal-class-properties'),
    ],
  };
};
