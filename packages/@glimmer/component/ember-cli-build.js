'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
const Funnel = require('broccoli-funnel');

module.exports = function(defaults) {
  let app = new EmberAddon(defaults, {
    configPath: './test/ember/dummy/config/environment',
    trees: {
      app: 'test/ember/dummy/app',
      public: 'test/ember/dummy/public',
      src: null,
      styles: 'test/ember/dummy/app/styles',
      templates: 'test/ember/dummy/app/templates',
      tests: new Funnel('test/ember', {
        exclude: [/^dummy/],
      }),
    },
  });

  /*
    This build file specifies the options for the dummy test app of this
    addon, located in `/tests/dummy`
    This build file does *not* influence how the addon or the app using it
    behave. You most likely want to be modifying `./index.js` or app's build file
  */

  return app.toTree();
};
