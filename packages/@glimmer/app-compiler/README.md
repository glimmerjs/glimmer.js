# @glimmer/app-compiler

A broccoli plugin that wraps Glimmer's optimizing compiler for producing the required pre-computed objects for Glimmer VM based applications.

## Basic Usage

For most apps the plugin can be used as the following:

```ts
import { BundleCompiler } from '@glimmer/app-compiler';
...

let optimizedApp = BundleCompiler(app, {
  projectPath: 'my-app',
  mode: 'module-unification'
});

return optimizedApp;
```

## Advanced Usage

If you need to do more advanced things like registering AST plugins or using custom project layout you can do something like the following:

```ts
import { BundleCompiler } from '@glimmer/app-compiler';
import { BundleCompilerDelegate } from '@glimmer/compiler-delegates'
...

class MyCustomCompilerDelegate implements BundleCompilerDelegate {
  ...
}

let optimizedApp = BundleCompiler(app, {
  projectPath: 'my-app',
  delegate: MyCustomCompilerDelegate,
  outputFiles: {
    heapFile: 'snowflake/location/template.gbx',
    dataSegment: 'snowflake/data.js'
  },
  bundleCompiler: {
    plugins: [MyASTPlugin]
  }
});

return optimizedApp;
```

### Options

```ts
interface GlimmerBundleCompilerOptions {
  projectPath: string;                      // where the project is at
  bundleCompiler: BundleCompilerOptions;    // Options specifically for the compiler
  outputFiles?: OutputFiles;                // Where to write the output
  delegate?: BundleCompilerDelegateConstructor; // Delegate to discover information about templates
  mode?: 'module-unification';              // Builtin delegate
}

interface BundleCompilerDelegateConstructor {
  new(): BundleCompilerDelegate;
}

export interface OutputFiles {
  dataSegment: Option<string>;
  heapFile: Option<string>;
}

interface BundleCompilerOptions {
  plugins?: ASTPluginBuilder[];
}
```
