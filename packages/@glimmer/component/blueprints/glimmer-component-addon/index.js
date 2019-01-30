'use strict';

const path = require('path');
const stringUtil = require('ember-cli-string-utils');
const getPathOption = require('ember-cli-get-component-path-option');
const normalizeEntityName = require('ember-cli-normalize-entity-name');

module.exports = {
  description: 'Generates a component.',

  fileMapTokens() {
    return {
      // path of the folder, containing the component JS/TS re-export module
      __path__({ pod, podPath, locals, dasherizedModuleName }) {
        if (pod) {
          return path.join(podPath, locals.path, dasherizedModuleName);
        }
        return 'components';
      },
      // name of the component JS/TS re-export module
      __name__({ pod, dasherizedModuleName }) {
        if (pod) {
          return 'component';
        }
        return dasherizedModuleName;
      },
      // name of the component JS/TS re-export and HBS re-export
      __root__({ inRepoAddon }) {
        if (inRepoAddon) {
          return path.join('lib', inRepoAddon, 'app');
        }
        return 'app';
      },
      // path of the containing folder, within __root__ where the HBS
      // re-export module is to be placed
      __templatepath__({ pod, podPath, locals, dasherizedModuleName }) {
        if (pod) {
          return path.join(podPath, locals.path, dasherizedModuleName);
        }
        return 'templates/components';
      },
      // name of HBS re-export module
      __templatename__({ pod, dasherizedModuleName }) {
        if (pod) {
          return 'template';
        }
        return dasherizedModuleName;
      }
    };
  },

  normalizeEntityName(entityName) {
    return normalizeEntityName(entityName);
  },

  locals(options) {
    const { inRepoAddon, inDummy, project, entity, pod } = options;
    const addonRawName = inRepoAddon ? inRepoAddon : project.name();
    const addonName = stringUtil.dasherize(addonRawName);
    const fileName = stringUtil.dasherize(entity.name);
    let templatePath = '';
    let importPathName = [addonName, 'components', fileName].join('/');

    // if we're in an addon, build import statement
    if (project.isEmberCLIAddon() || (inRepoAddon && !inDummy)) {
      if (pod) {
        templatePath = './template';
      } else {
        templatePath = [
          addonName,
          'templates/components',
          stringUtil.dasherize(entity.name)
        ].join('/');
      }
    }

    if (pod) {
      importPathName = [addonName, 'components', fileName, 'component'].join(
        '/'
      );
    }

    return {
      modulePath: importPathName,
      templatePath,
      path: getPathOption(options)
    };
  }
};
