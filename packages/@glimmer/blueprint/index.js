'use strict';

const dasherize = require('ember-cli-string-utils').dasherize;
const stringUtils = require('ember-cli-string-utils');

module.exports = {
  description: 'Ember CLI blueprint for initializing a new Glimmer application',

  // filesToRemove: [
  //   'app/styles/.gitkeep',
  //   'app/templates/.gitkeep',
  // ],

  locals(options) {
    let name = options.entity.name;
    let component = componentize(name);
    let className = stringUtils.classify(options.entity.name);

    return { name, className, component };
  },

  fileMapTokens(options) {
    return {
      __component__() { return options.locals.component }
    }
  },

  files() {
    let files = this._super.files.apply(this, arguments);

    if (this.project.pkg.name) {
      files = files.filter((file) => file !== 'yarn.lock');
    }
    
    return files;
  },

  afterInstall(options) {
    if (options.webComponent) {
      return this._installWebComponentSupport(options);
    }
  },

  _installWebComponentSupport(options) {
    let name = options.entity.name;
    let component = componentize(name);

    let addPackagePromise = this.addPackageToProject('@glimmer/web-component');
    let indexTSPromise = this.insertIntoFile(
      'src/index.ts',
      "import initializeCustomElements from '@glimmer/web-component';",
      { after: "import { ComponentManager, setPropertyDidChange } from '@glimmer/component';\n" }
    ).then(() => {
      return this.insertIntoFile(
        'src/index.ts',
        `initializeCustomElements(app, ['${component}']);\n`
      );
    });

    return Promise.all([
      addPackagePromise,
      indexTSPromise
    ]);
  }
};

// Component names must have at least one dash, so we suffix the component name
// with `-app` if it doesn't have one. E.g.: `avatar` -> `avatar-app`
function componentize(name) {
  let dasherized = dasherize(name);
  return hasDash(dasherized) ? dasherized : `${dasherized}-app`;
}

function hasDash(string) {
  return string.indexOf('-') > -1;
}
