import { BytecodeData } from '@glimmer/application';
import { BundleCompiler } from '@glimmer/bundle-compiler';
import { MUCompilerDelegate } from '@glimmer/compiler-delegates';
import { ModuleLocator } from '@glimmer/interfaces';

import rollup from 'rollup';
import virtual from 'rollup-plugin-virtual';
import babel from 'babel-core';
import transformCJS from 'babel-plugin-transform-es2015-modules-commonjs';
import * as fs from 'fs';
import * as path from 'path';
import { sync as findup } from 'find-up';
import * as os from 'os';

export class BuildServer {
  private compiler: BundleCompiler;
  private delegate: MUCompilerDelegate;
  public projectPath: string;
  private tmp: string;
  private bytecode: ArrayBuffer;
  constructor(relativeProjectPath: string, customLocator: ModuleLocator) {
    this.tmp = os.tmpdir();
    this.projectPath = findup(relativeProjectPath);
    this.delegate = new MUCompilerDelegate({
      projectPath: this.projectPath,
      builtins: {
        wat: {
          kind: 'helper',
          module: '@css-blocks',
          name: 'wat',
          meta: { factory: false },
        },
      },
      mainTemplateLocator: customLocator,
      outputFiles: {
        dataSegment: 'data.js',
        heapFile: 'templates.gbx',
      },
    });
    this.compiler = new BundleCompiler(this.delegate);
  }

  addTemplate(locator: ModuleLocator, content: string) {
    let { compiler } = this;

    compiler.addTemplateSource(locator, content);
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
          './src/ui/components/id/helper': 'export default function id() { return "ID_STUB"; }',
          '@css-blocks': 'export const wat = () => { return "WAT_STUB"; }',
          '@glimmer/application': 'export const ifHelper = () => { return "IF_STUB" };',
        }),
      ],
    });
    let { code } = await bundle.generate({ format: 'es' });
    let transformed = babel.transform(code, {
      plugins: [transformCJS],
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
      bytecode: this.bytecode,
    };
  }
}
