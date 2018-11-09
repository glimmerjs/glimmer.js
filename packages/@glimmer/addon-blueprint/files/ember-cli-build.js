const {
  GlimmerAddon
} = require('@glimmer/application-pipeline');

module.exports = function (defaults) {
  let addon = new GlimmerAddon(defaults, {
    name: '<%= name %>'
  });

  return addon.toTree();
}