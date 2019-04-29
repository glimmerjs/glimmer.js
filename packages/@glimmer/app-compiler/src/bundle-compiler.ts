import { AppCompilerDelegate, mainTemplate } from '@glimmer/application';
import { BundleCompiler, BundleCompilerOptions } from '@glimmer/bundle-compiler';
import {
  AppCompilerDelegateOptions,
  Builtins,
  MUCompilerDelegate,
  OutputFiles,
} from '@glimmer/compiler-delegates';
import { compilable } from '@glimmer/opcode-compiler';
import Plugin from 'broccoli-plugin';
import { TempDir } from 'broccoli-test-helper';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import walkSync from 'walk-sync';

// https://github.com/joliss/node-walk-sync/blob/984a2d6adf9facc1531fb325852f475eb260781d/index.d.ts
export class WalkSyncEntry {
  relativePath: string;
  basePath: string;
  fullPath: string;
  mode: number;
  size: number;
  mtime: Date;
  isDirectory: Function;
}

export type CompilerMode = 'module-unification';

export interface AppCompilerDelegateConstructor {
  new (options: AppCompilerDelegateOptions): AppCompilerDelegate<{}>;
}

export interface GlimmerBundleCompilerOptions {
  bundleCompiler?: BundleCompilerOptions;
  outputFiles?: OutputFiles;
  delegate?: AppCompilerDelegateConstructor;
  mode?: CompilerMode;
  builtins?: Builtins;
}

export default class GlimmerBundleCompiler extends Plugin {
  options: GlimmerBundleCompilerOptions;
  inputPaths: string[];
  outputPath: string;
  compiler: BundleCompiler;

  // TODO: Better handle generic TemplateMeta for compiler delegates
  private delegate: AppCompilerDelegate<any>;
  constructor(inputNode: TempDir | string, options: GlimmerBundleCompilerOptions) {
    super([inputNode], options);
    this.options = this.defaultOptions(options);
  }

  private defaultOptions(options: GlimmerBundleCompilerOptions) {
    if (!options.mode && !options.delegate) {
      throw new Error('Must pass a bundle compiler mode or pass a custom compiler delegate.');
    }

    return Object.assign(
      {
        outputFiles: {
          heapFile: 'templates.gbx',
          dataSegment: 'data-segment.js',
        },
      },
      options
    );
  }

  listEntries(): WalkSyncEntry[] {
    let [srcPath] = this.inputPaths;
    return walkSync.entries(srcPath);
  }

  _readFile(file: string) {
    return readFileSync(join(this.inputPaths[0], file), 'UTF-8');
  }

  createBundleCompiler() {
    let delegate;
    let options = this.options;
    let { outputFiles, builtins } = options;
    let [projectPath] = this.inputPaths;

    if (options.mode && options.mode === 'module-unification') {
      delegate = this.delegate = new MUCompilerDelegate({
        projectPath,
        outputFiles,
        builtins,
      });
    } else if (options.delegate) {
      delegate = this.delegate = new options.delegate({
        projectPath,
        outputFiles,
        builtins,
      });
    }

    this.compiler = new BundleCompiler(delegate, options.bundleCompiler);
  }

  build() {
    this.createBundleCompiler();

    let { outputPath } = this;

    let locator = this.delegate.templateLocatorFor({
      module: '@glimmer/application',
      name: 'mainLayout',
    });
    let block = JSON.parse(mainTemplate.block);
    let compilableTemplate = compilable({
      block,
      referrer: locator.meta,
      asPartial: false,
    });

    this.compiler.addCompilableTemplate(locator, compilableTemplate);

    let [projectPath] = this.inputPaths;

    this.listEntries().forEach((entry: WalkSyncEntry) => {
      let { relativePath } = entry;
      if (entry.isDirectory()) {
        mkdirSync(join(outputPath, relativePath));
      } else {
        let content = this._readFile(relativePath);
        if (extname(relativePath) === '.hbs') {
          let normalizedPath = this.delegate.normalizePath(join(projectPath, relativePath));
          let moduleLocator = { module: normalizedPath, name: 'default' };
          let templateLocator = this.delegate.templateLocatorFor(moduleLocator);
          this.compiler.addTemplateSource(templateLocator, content);
        } else {
          writeFileSync(join(outputPath, relativePath), content);
        }
      }
    });

    let compilation = this.compiler.compile();
    let dataSegment = this.delegate.generateDataSegment(compilation);

    let { outputFiles } = this.options;

    writeFileSync(join(outputPath, outputFiles.dataSegment), dataSegment);
    writeFileSync(join(outputPath, outputFiles.heapFile), new Buffer(compilation.heap.buffer));
  }
}
