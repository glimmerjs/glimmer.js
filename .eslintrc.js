module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint', 'prettier'],

  overrides: [
    // node files
    {
      files: [
        '.eslintrc.js',
        'babel.config.js',
        'standalone.js',
        '**/testem.js',
        '**/config/ember-try.js',
        '**/config/environment.js',
        '**/config/targets.js',
        '**/ember-cli-build.js',
        '**/ember-addon-main.js',
        '**/bin/**/*.js',
        '**/scripts/**/*.js',
        '**/blueprints/**/*.js',
        'webpack.config.js',
        'packages/@glimmer/babel-preset/**/*.js',
        'packages/@glimmer/blueprint/index.js',
        '**/babel-plugins.js'
      ],
      env: {
        es6: true,
        node: true,
      },
    },
    {
      files: [
        'packages/babel-plugins/**/test/**/*.js',
      ],
      env: {
        es6: true,
        node: true,
        mocha: true,
      },
    },
    // bin scripts
    {
      files: ['bin/**/*.js'],
      rules: {
        'no-process-exit': 'off',
      },
    },
    // source Js
    {
      files: ['**/src/**/*.js', '**/test/**/*.js'],
      env: {
        es2020: true,
        browser: true,
      },
      parserOptions: {
        sourceType: 'module',
      },
    },
    // TypeScript source
    {
      files: ['**/*.ts'],
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier/@typescript-eslint',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

        '@typescript-eslint/ban-types': ['error', {
          types: {
            // we currently use `object` as "valid WeakMap key" in a lot of APIs
            object: false,

            // this is a great one to ban, will do in a followup PR
            '{}': false,
          }
        }],

        // disabling this one because of DEBUG APIs, if we ever find a better
        // way to suport those we should re-enable it
        '@typescript-eslint/no-non-null-assertion': 'off',

        '@typescript-eslint/no-use-before-define': 'off',
      }
    },
  ],
};
