'use strict';

const path = require('path');
const stringUtil = require('ember-cli-string-utils');
const getPathOption = require('ember-cli-get-component-path-option');
const normalizeEntityName = require('ember-cli-normalize-entity-name');
const isModuleUnificationProject = require('../module-unification')
  .isModuleUnificationProject;

module.exports = {
  description: 'Generates a @glimmer/component',

  availableOptions: [
    {
      name: 'path',
      type: String,
      default: 'components',
      aliases: [{ 'no-path': '' }]
    },
    {
      name: 'lang',
      type: String
    }
  ],

  filesPath() {
    let filesDirectory = 'files';

    if (isModuleUnificationProject(this.project)) {
      filesDirectory = 'module-unification-files';
    }

    return path.join(this.path, filesDirectory);
  },

  fileMapTokens() {
    if (isModuleUnificationProject(this.project)) {
      return {
        // component extension (ts or js)
        __ext__(options) {
          return options.locals.lang;
        },
        // component root folder (i.e., app, addon, etc...)
        __root__({ inRepoAddon, inDummy }) {
          if (inRepoAddon) {
            return path.join('packages', inRepoAddon, 'src');
          }
          if (inDummy) {
            return path.join('tests', 'dummy', 'src');
          }
          return 'src';
        },
        // component path within __root__
        __path__({ dasherizedModuleName }) {
          return path.join('ui', 'components', dasherizedModuleName);
        }
      };
    } else {
      return {
        // component extension (ts or js)
        __ext__(options) {
          return options.locals.lang;
        },
        // component path within app or addon folder
        __path__({ pod, podPath, locals, dasherizedModuleName }) {
          if (pod) {
            return path.join(podPath, locals.path, dasherizedModuleName);
          } else {
            return 'components';
          }
        },
        // path of the folder for component's template
        // NOTE: in an addon, this will be the private template
        //       in the /addon/templates/components folder
        __templatepath__({ pod, podPath, locals, dasherizedModuleName }) {
          if (pod) {
            return path.join(podPath, locals.path, dasherizedModuleName);
          }
          return 'templates/components';
        },
        // name of the template file
        __templatename__({ pod, dasherizedModuleName }) {
          if (pod) {
            return 'template';
          }
          return dasherizedModuleName;
        }
      };
    }
  },

  normalizeEntityName(entityName) {
    return normalizeEntityName(entityName);
  },

  getDefaultLang(options) {
    // if the ember-cli-typescript addon is detected, use ts as default
    if ('ember-cli-typescript' in options.project.addonPackages) return 'ts';
    else return 'js'; // otherwise use js as default
  },
  locals(options) {
    const { lang = this.getDefaultLang(options) } = options;
    const classifiedModuleName = stringUtil.classify(options.entity.name);
    return {
      classifiedModuleName,
      lang,
      path: getPathOption(options)
    };
  }
};
