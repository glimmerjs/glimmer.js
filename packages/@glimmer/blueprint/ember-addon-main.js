'use strict';

/*
  Create an "addon blueprint" that simply defers to our
  top level entry point as the blueprint.

  This is basically just a work around for
  https://github.com/ember-cli/ember-cli/issues/6952.

  Once that issue is fixed and released we can remove:

  * ember-addon keyword in package.json
  * ember-addon key in package.json
  * ember-addon-main.js file
  * blueprints/ folder
  */
module.exports = {
  name: '@glimmer/blueprint'
};
