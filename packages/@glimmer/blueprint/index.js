'use strict';

const dasherize = require('ember-cli-string-utils').dasherize;
const classify = require('ember-cli-string-utils').classify;

module.exports = {
  description: 'Ember CLI blueprint for initializing a new Glimmer application',

  locals(options) {
    const name = dasherize(options.entity.name);
    const component = classify(name);
    const className = classify(options.entity.name);
    const blueprintVersion = require('./package').version;

    return {
      name,
      className,
      component,
      blueprintVersion,
    };
  },

  fileMapTokens(options) {
    return {
      __component__() {
        return options.locals.component;
      },
    };
  },

  files() {
    let files = this._super.files.apply(this, arguments);

    if (this._shouldIncludeYarnLockInFiles()) {
      files = files.filter(file => file !== 'yarn.lock');
    }

    return files;
  },

  afterInstall(options) {
    if (options.webComponent) {
      this._validateWebComponentName(options);
      return this._installWebComponentSupport(options);
    }
  },

  _validateWebComponentName(options) {
    const customElementName = options.webComponent;

    if (typeof customElementName !== 'string') {
      throw 'You must provide a name for the web component, eg. `--web-component=button-list`';
    }

    if (!hasDash(customElementName)) {
      throw `The web component name must contain a dash. You provided "${customElementName}"`;
    }
  },

  _installWebComponentSupport(options) {
    const customElementName = options.webComponent;
    const glimmerComponentName = classify(options.entity.name);

    const addPackagePromise = this.addPackageToProject('@glimmer/web-component');
    const indexTSPromise = this.insertIntoFile(
      'src/index.ts',
      "import initializeCustomElements from '@glimmer/web-component';",
      { after: "import { setPropertyDidChange } from '@glimmer/tracking';\n" }
    ).then(() => {
      return this.insertIntoFile(
        'src/index.ts',
        `initializeCustomElements(app, { '${customElementName}': '${glimmerComponentName}' });\n`
      );
    });

    return Promise.all([addPackagePromise, indexTSPromise]);
  },

  _shouldIncludeYarnLockInFiles() {
    return !!this.project.pkg.name;
  },
};

function hasDash(string) {
  return string.indexOf('-') > -1;
}
