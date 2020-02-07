const babelDebugMacros = require('babel-plugin-debug-macros');

module.exports = function macros(babel, options) {
  const debugMacros = babelDebugMacros(babel, options);

  const originalProgram = debugMacros.visitor.Program;

  debugMacros.visitor.Program = {
    enter(path, state) {
      const DEBUG = 'DEBUG' in state.opts ? state.opts.DEBUG : true;

      state.opts = {
        flags: [{ source: '@glimmer/env', flags: { DEBUG } }],
      };

      originalProgram.enter.call(this, path, state);
    },

    exit(path, state) {
      originalProgram.exit.call(this, path, state);
    },
  };

  return debugMacros;
};
