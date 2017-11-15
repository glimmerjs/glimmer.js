import { BytecodeData } from '@glimmer/application';
import { BundleCompiler, ModuleLocator } from '@glimmer/bundle-compiler';
import { MUCompilerDelegate } from '@glimmer/compiler-delegates';
import rollup from 'rollup';
import virtual from 'rollup-plugin-virtual';
import { Opaque } from '@glimmer/util';
import babel from 'babel-core';
import transformCJS from 'babel-plugin-transform-es2015-modules-commonjs';
import * as fs from 'fs';
import * as path from 'path';
import { sync as findup } from 'find-up';
import * as os from 'os';

export class BuildServer {
  private compiler: BundleCompiler<Opaque>;
  private delegate: MUCompilerDelegate;
  public projectPath: string;
  private tmp: string;
  private bytecode: ArrayBuffer;
  constructor() {
    this.tmp = os.tmpdir();
    this.projectPath = findup('packages/@glimmer/compiler-delegates/test/node/fixtures/mu');
    this.delegate = new MUCompilerDelegate({
      projectPath: this.projectPath,
      mainTemplateLocator: { module: './src/ui/components/My-Main/template.hbs', name: 'default' },
      outputFiles: {
        dataSegment: 'data.js',
        heapFile: 'templates.gbx'
      }
    });
    this.compiler = new BundleCompiler(this.delegate);
  }

  addTemplate(locator: ModuleLocator, content: string) {
    let { compiler } = this;
    compiler.add(locator, content);
  }

  build() {
    let { compiler, tmp } = this;
    let result = compiler.compile();
    let code = this.delegate.generateDataSegment(result);
    fs.writeFileSync(path.join(tmp, 'smoke-data.js'), code);
    this.bytecode = result.heap.buffer;
  }

  private async bundle() {
    let { tmp } = this;
    const bundle = await rollup.rollup({
      entry: path.join(tmp, 'smoke-data.js'),
      plugins: [
        virtual({
          '@glimmer/application': 'export const ifHelper = () => { return "STUB" };'
        })
      ]
    });
    let { code } = await bundle.generate({ format: 'es' });
    let transformed = babel.transform(code, {
      plugins: [transformCJS]
    });

    fs.writeFileSync(path.join(tmp, 'smoke-data.js'), transformed.code);
  }

  async fetch() {
    let { tmp } = this;
    await this.bundle();
    /* tslint:disable */
    let code = require(path.join(tmp, 'smoke-data.js')).default as BytecodeData;
    /* tslint:enable */
    return {
      data: code,
      bytecode: this.bytecode
    };
  }
}
