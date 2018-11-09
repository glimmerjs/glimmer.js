const {
  GlimmerAddon
} = require('@glimmer/application-pipeline');

module.exports = function (defaults) {
  let addon = GlimmerAddon(defaults, {
    name: '<%= name %>'
  });

  return addon.toTree();
}