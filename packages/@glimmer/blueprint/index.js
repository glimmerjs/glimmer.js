const dasherize = require('ember-cli-string-utils').dasherize;

module.exports = {
  description: 'Ember CLI blueprint for initializing a new Glimmer application',

  // filesToRemove: [
  //   'app/styles/.gitkeep',
  //   'app/templates/.gitkeep',
  // ],

  locals(options) {
    let name = options.entity.name;
    let component = componentize(name);

    return { name, component };
  },

  fileMapTokens(options) {
    return {
      __component__() { return options.locals.component }
    }
  }
};

// Component names must have at least one dash, so we prefix the component name
// if it doesn't have one. E.g.: `avatar` -> `-avatar`
function componentize(name) {
  dasherized = dasherize(name);
  return hasDash(dasherized) ? dasherized : `-${dasherized}`;
}

function hasDash(string) {
  return string.indexOf('-') > -1;
}