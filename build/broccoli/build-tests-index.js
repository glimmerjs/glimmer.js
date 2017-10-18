const glob = require('glob');
const fs = require('fs');
const path = require('path');
const Plugin = require('broccoli-plugin');

class TestIndexBuilder extends Plugin {
  constructor(inputTree, options) {
    if (!options.filter) { throw new Error('Must pass filter to TestIndexBuilder'); }
    if (!options.outputFile) { throw new Error('Must pass outputFile to TestIndexBuilder'); }

    super([inputTree], options);

    this.filter = options.filter;
    this.outputFile = options.outputFile;
  }

  build() {
    let pattern = this.filter;
    let input = this.inputPaths[0];

    return globAsync(pattern, { cwd: input })
      .then(files => {
        let source = files
          .map(f => f.replace(/\.[jt]s$/, ''))
          .map(f => `import "./${f}";`)
          .join('\n');

        let outputPath = path.join(this.outputPath, this.outputFile);

        return writeFileAsync(outputPath, source);
      });
  }
}

function globAsync(pattern, options) {
  return new Promise((resolve, reject) => {
    glob(pattern, options, (err, files) => {
      if (err) { reject(err); }
      resolve(files);
    });
  });
}

function writeFileAsync(fileName, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, data, err => {
      if (err) { reject(err); }
      resolve();
    });
  });
}

module.exports = function buildTestIndex(inputTree, options) {
  return new TestIndexBuilder(inputTree, options);
};

