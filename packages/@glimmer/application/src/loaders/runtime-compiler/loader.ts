import { TemplateIterator, Environment, ElementBuilder, templateFactory, DynamicScope } from '@glimmer/runtime';
import { Resolver } from '@glimmer/di';
import { Macros, LazyOpcodeBuilder, OpcodeBuilderConstructor } from '@glimmer/opcode-compiler';
import { Program, LazyConstants } from '@glimmer/program';
import { Opaque } from '@glimmer/interfaces';
import { PathReference } from '@glimmer/reference';

import Application, { Loader } from '../../application';
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
 */
export default class RuntimeCompilerLoader implements Loader {
  constructor(public resolver: Resolver) {
  }

  getTemplateIterator(app: Application, env: Environment, builder: ElementBuilder, dynamicScope: DynamicScope, self: PathReference<Opaque>): TemplateIterator {
    let resolver = new RuntimeResolver(app);
    let program = new Program(new LazyConstants(resolver));
    let macros = new Macros();
    let lookup = new CompileTimeLookup(resolver);

    let compileOptions = {
      program,
      macros,
      resolver: lookup,
      Builder: LazyOpcodeBuilder as OpcodeBuilderConstructor
    };

    resolver.setCompileOptions(compileOptions);

    resolver.registerTemplate('main', mainTemplate);
    resolver.registerInternalHelper('action', actionHelper);
    resolver.registerHelper('if', ifHelper);

    let mainLayout = templateFactory(mainTemplate).create(compileOptions);

    return mainLayout.renderLayout({
      env,
      builder,
      dynamicScope,
      self
    });
  }
}
