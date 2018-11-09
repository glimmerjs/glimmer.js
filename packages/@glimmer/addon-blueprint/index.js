'use strict';

const dasherize = require('ember-cli-string-utils').dasherize;
const classify = require('ember-cli-string-utils').classify;

module.exports = {
  description: 'Ember CLI blueprint for initializing a new Glimmer addon',

  locals(options) {
    let name = dasherize(options.entity.name);
    let component = classify(name);
    let className = classify(options.entity.name);
    let blueprintVersion = require('./package').version;

    return {
      name,
      className,
      component,
      blueprintVersion
    };
  }
}