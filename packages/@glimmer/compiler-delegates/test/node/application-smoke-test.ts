// import { Application } from '@glimmer/application';
import { BundleCompiler } from '@glimmer/bundle-compiler';
import { module, /*test, */ only} from 'qunitjs';
import { MUCompilerDelegate } from '@glimmer/compiler-delegates';
import { sync as findup } from 'find-up';
import * as fs from 'fs';
import * as path from 'path';
import babel from 'babel-core';
import transformCJS from 'babel-plugin-transform-es2015-modules-commonjs';

let compiler;
module('Application smoke tests', {
  beforeEach() {
    let projectPath = findup('packages/@glimmer/compiler-delegates/test/node/fixtures/mu');

    let delegate = new MUCompilerDelegate({
      projectPath,
      mainTemplateLocator: { module: './src/ui/components/My-Main/template.hbs', name: 'default' },
      outputFiles: {
        dataSegment: 'data.js',
        heapFile: 'templates.gbx'
      }
    });

    compiler = new BundleCompiler(delegate);
    compiler.add({ module: './src/ui/components/My-Main/template.hbs', name: 'default' }, fs.readFileSync(path.join(projectPath, 'src/ui/components/My-Main/template.hbs')).toString());
    compiler.add({ module: './src/ui/components/User/template.hbs', name: 'default' }, fs.readFileSync(path.join(projectPath, 'src/ui/components/User/template.hbs')).toString());
    let result = compiler.compile();
    let code = delegate.generateDataSegment(result);
    let transformed = babel.transform(code, {
      plugins: [transformCJS]
    });

    console.log(transformed);
  }
});

only('ok', (assert) => {
  assert.ok(true);
})
