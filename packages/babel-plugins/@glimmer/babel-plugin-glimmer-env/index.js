const babelDebugMacros = require('babel-plugin-debug-macros');

module.exports = function macros(babel, options) {
  let debugMacros = babelDebugMacros(babel, options);

  let originalProgram = debugMacros.visitor.Program;

  debugMacros.visitor.Program = {
    enter(path, state) {
      let DEBUG = 'DEBUG' in state.opts ? state.opts.DEBUG : true;

      state.opts = {
        flags: [
          { source: '@glimmer/env', flags: { DEBUG } },
        ],
      }

      originalProgram.enter.call(this, path, state);
    },

    exit(path, state) {
      originalProgram.exit.call(this, path, state);
    }
  };

  return debugMacros;
}
