import { GlimmerBundleCompiler } from '@glimmer/app-compiler';
import { createTempDir, buildOutput, TempDir, Tree } from 'broccoli-test-helper';

const { module, test } = QUnit;

module('Broccol Glimmer Bundle Compiler', function(hooks) {
  let input:TempDir = null;

  hooks.beforeEach(() => createTempDir().then(tempDir => (input = tempDir)));

  hooks.afterEach(() => {
    input.dispose();
  });

  test('requires a mode or delegate', function (assert) {
    assert.throws(() => {
      // tslint:disable-next-line:no-unused-expression
      new GlimmerBundleCompiler(input.path(), {});
    }, /Must pass a bundle compiler mode or pass a custom compiler delegate\./);
  });

  test('syncs forward all files', async function(assert) {
    input.write({
      'package.json': JSON.stringify({name: 'my-app'}),
      src: {
        ui: {
          components: {
            A: {
              'template.hbs': '<div>Hello</div>',
              'component.ts': 'export default class A {}'
            },

            B: {
              'template.hbs': 'From B: <A @foo={{bar}} /> {{@bar}}',
              'component.ts': 'export default class B {}'
            },

            C: {
              'template.hbs': 'From C',
              'component.ts': 'export default class C {}'
            },

            D: {
              'template.hbs': '{{component C}}',
              'component.ts': 'export default class D {}'
            }
          }
        }
      }
    });

    let compiler = new GlimmerBundleCompiler(input.path(), {
      mode: 'module-unification'
    });

    let output = await buildOutput(compiler);
    let files: Tree = output.read();

    assert.deepEqual(Object.keys(files).sort(), ['src', 'package.json', 'templates.gbx', 'data-segment.js'].sort());
    assert.deepEqual(Object.keys(files['src']).sort(), ['ui'].sort());
    assert.deepEqual(Object.keys(files['src']['ui']), ['components']);

    Object.keys(files['src']['ui'].components).forEach((component) => {
      assert.deepEqual(Object.keys(files['src']['ui'].components[component]), ['component.ts']);
    });
  });

  test('[MU] compiles the gbx and data segment', async function(assert) {
    input.write({
      'package.json': JSON.stringify({name: 'my-app'}),
      src: {
        ui: {
          components: {
            A: {
              'template.hbs': '<div>Hello</div>'
            },

            B: {
              'template.hbs': 'From B: <A @foo={{bar}} /> {{@bar}}'
            },

            C: {
              'template.hbs': 'Hello From C'
            },

            D: {
              'template.hbs': '{{component C}}'
            }
          }
        }
      }
    });

    let compiler = new GlimmerBundleCompiler(input.path(), {
      mode: 'module-unification'
    });

    let output = await buildOutput(compiler);
    let files = output.read();

    let buffer = new Uint16Array(files['src']['templates.gbx']);

    assert.ok(buffer, 'Buffer is aligned');
    assert.ok((files['data-segment.js'] as string).match(/Hello From C/));

    input.write({
      src: {
        ui: {
          components: {
            C: {
              'template.hbs': 'Goodbye From C'
            }
          }
        }
      }
    });

    await output.build();

    files = output.read();
    buffer = new Uint16Array(files['src']['templates.gbx']);

    assert.ok(buffer, 'Buffer is aligned');

    let dataSegment = files['data-segment.js'] as string;
    assert.ok(dataSegment.match(/Goodbye From C/), "string constants should contain updated template contents");
    assert.ok(!(dataSegment.match(/Hello From C/)), "string constants should not contain old content");
  });

  test('data segment has all segments', async function(assert) {
    input.write({
      'package.json': JSON.stringify({name: 'my-app'}),
      src: {
        ui: {
          components: {
            A: {
              'template.hbs': '<div>Hello</div>'
            },

            B: {
              'template.hbs': 'From B: <A @foo={{bar}} /> {{@bar}}'
            },

            C: {
              'template.hbs': 'From C'
            },

            D: {
              'template.hbs': '{{component C}}'
            }
          }
        }
      }
    });

    let compiler = new GlimmerBundleCompiler(input.path(), {
      mode: 'module-unification'
    });

    let output = await buildOutput(compiler);
    let files = output.read();
    let dataSegment = files['data-segment.js'] as string;
    assert.ok(dataSegment.length > 0, 'data segment is populated');
    assert.ok(dataSegment.indexOf('table') > -1, 'has a table');
    assert.ok(dataSegment.indexOf('heap') > -1, 'has a heap');
    assert.ok(dataSegment.indexOf('pool') > -1, 'has a constant pool');
    assert.ok(dataSegment.indexOf('meta') > -1, 'has a specifier map');
  });

  test('can lookup builtins', async function(assert) {
    input.write({
      'package.json': JSON.stringify({name: 'my-app'}),
      src: {
        ui: {
          components: {
            A: {
              'template.hbs': '<div>Hello {{if true "wat"}}</div>'
            }
          }
        }
      }
    });

    let compiler = new GlimmerBundleCompiler(input.path(), {
      mode: 'module-unification'
    });

    let output = await buildOutput(compiler);
    let files = output.read();
    let dataSegment = files['data-segment.js'] as string;
    assert.ok(dataSegment.indexOf('import { ifHelper as ') > -1);
  });

  test('can write binary and data to different output paths', async function(assert) {
    input.write({
      'package.json': JSON.stringify({name: 'my-app'}),
      src: {
        ui: {
          components: {
            A: {
              'template.hbs': '<div>Hello {{if true "wat"}}</div>'
            }
          }
        }
      }
    });

    let compiler = new GlimmerBundleCompiler(input.path(), {
      mode: 'module-unification',
      outputFiles: {
        dataSegment: 'stuff.js',
        heapFile: 'templates.bin'
      }
    });

    let output = await buildOutput(compiler);
    let files = output.read();
    assert.ok(files['stuff.js']);
    assert.ok(files['templates.bin']);
  });

  test('can lookup custom builtins', async function(assert) {
    input.write({
      'package.json': JSON.stringify({name: 'my-app'}),
      src: {
        ui: {
          components: {
            A: {
              'template.hbs': '<div>Hello {{css-blocks/state true "wat"}} {{if true "true"}} {{css-blocks/state true "huh"}}</div>'
            },
            B: {
              'template.hbs': '<A /><p class={{css-blocks/style-if true "wat"}}>Red</p>'
            }
          }
        }
      }
    });

    let compiler = new GlimmerBundleCompiler(input.path(), {
      builtins: {
        'css-blocks/style-if': { module: '@css-block/helpers/style-if', name: 'default' },
        'css-blocks/state': { module: '@css-block/helpers/state', name: 'default' },
        'css-blocks/concat': { module: '@css-block/helpers/concat', name: 'default' }
      },
      mode: 'module-unification'
    });

    let output = await buildOutput(compiler);
    let files = output.read();
    let dataSegment = files['data-segment.js'] as string;
    assert.ok(dataSegment.split('@css-block/helpers/state').length === 2);
    assert.ok(dataSegment.indexOf('@css-block/helpers/state') > -1);
    assert.ok(dataSegment.indexOf('@css-block/helpers/style-if') > -1);
    assert.ok(dataSegment.indexOf('@css-block/helpers/style-concat') === -1);
  });

});
