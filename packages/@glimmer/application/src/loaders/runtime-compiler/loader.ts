import { TemplateIterator, Environment, ElementBuilder, DynamicScope, renderMain, RenderComponentArgs } from '@glimmer/runtime';
import { Resolver } from '@glimmer/di';
import { Macros, templateFactory, LazyCompiler } from '@glimmer/opcode-compiler';
import { Opaque } from '@glimmer/interfaces';
import { PathReference } from '@glimmer/reference';

import Application, { Loader, BaseApplication } from '../../application';
import mainTemplate from '../../templates/main';
import { actionHelper, ifHelper } from '../../helpers';

import RuntimeResolver from './resolver';
import CompileTimeLookup from './compile-time-lookup';

export interface Specifier {
  specifier: string;
  managerId?: string;
};

/**
 * The RuntimeCompilerLoader is used by Glimmer.js applications that perform the
 * final template compilation step client-side. It configures the compiler to
 * resolve templates, helpers and other objects from the runtime registry, and
 * enables just-in-time compilation of templates as they are encountered.
 *
 * @public
 */
export default class RuntimeCompilerLoader implements Loader {
  constructor(public resolver: Resolver) {
  }

  async getTemplateIterator(app: Application, env: Environment, builder: ElementBuilder, dynamicScope: DynamicScope, self: PathReference<Opaque>): Promise<TemplateIterator> {
    let resolver = new RuntimeResolver(app);
    let lookup = new CompileTimeLookup(resolver);
    let macros = new Macros();
    let compiler = new LazyCompiler<Specifier>(lookup, resolver, macros);
    let program = compiler.program;

    resolver.compiler = compiler;

    resolver.registerTemplate('main', mainTemplate);
    resolver.registerInternalHelper('action', actionHelper);
    resolver.registerHelper('if', ifHelper);

    let mainLayout = templateFactory(mainTemplate).create(compiler);

    return Promise.resolve(renderMain(
      program,
      env,
      self,
      dynamicScope,
      builder,
      mainLayout.asLayout().compile()
    ));
  }

  getComponentTemplateIterator(app: BaseApplication, env: Environment, builder: ElementBuilder, componentName: string, args: RenderComponentArgs): Promise<TemplateIterator> {
    throw new Error("Method not implemented.");
  }
}
