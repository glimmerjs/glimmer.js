const Filter = require('broccoli-persistent-filter');
const compiler = require('@glimmer/compiler');

class GlimmerTemplatePrecompiler extends Filter {
  constructor(inputNode, options) {
    super(...arguments);
    this.options = options || {};
    this.extensions = ['hbs'];
    this.targetExtension = 'ts';
  }

  processString(content, relativePath) {
    let specifier = getTemplateSpecifier(this.options.rootName, relativePath);
    return 'export default ' + compiler.precompile(content, { meta: { specifier } }) + ';';
  }
}

function getTemplateSpecifier(rootName, relativePath) {
  let path = relativePath.split('/');
  let prefix = path.shift();

  // TODO - should use module map config to be rigorous
  if (path[path.length - 1] === 'template.hbs') {
    path.pop();
  }
  if (path[0] === 'ui') {
    path.shift();
  }

  return 'template:/' + rootName + '/' + path.join('/');
}

module.exports = GlimmerTemplatePrecompiler;
