const glob = require('glob');
const path = require('path');
const writeFile = require('broccoli-file-creator');

const PROJECT_ROOT = path.join(__dirname, '../../packages');
const TEST_GLOB = '@glimmer/*/test/**/*-test.{js,ts}';

module.exports = function() {
  let testFiles = glob.sync(TEST_GLOB, { cwd: PROJECT_ROOT });
  let source = testFiles
    .map(f => f.replace(/\.[jt]s$/, ''))
    .map(f => `import "./${f}";`)
    .join('\n');

  return writeFile('tests.js', source);
};

