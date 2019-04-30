import { RenderComponentArgs, CustomJitRuntime, renderJitMain } from '@glimmer/runtime';
import { Resolver } from '@glimmer/di';
import { templateFactory, JitContext } from '@glimmer/opcode-compiler';
import { PathReference } from '@glimmer/reference';
import { Environment, ElementBuilder, DynamicScope, TemplateIterator } from '@glimmer/interfaces';

import Application from '../../application';
import BaseApplication, { Loader } from '../../base-application';
import mainTemplate from '../../templates/main';
import { actionHelper, ifHelper } from '../../helpers';

import RuntimeResolver from './resolver';
import ResolverDelegateImpl from './resolver-delegate';

export interface Specifier {
  specifier: string;
  managerId?: string;
}

/**
 * The RuntimeCompilerLoader is used by Glimmer.js applications that perform the
 * final template compilation step client-side. It configures the compiler to
 * resolve templates, helpers and other objects from the runtime registry, and
 * enables just-in-time compilation of templates as they are encountered.
 *
 * @public
 */
export default class RuntimeCompilerLoader implements Loader {
  constructor(public resolver: Resolver) {}

  async getTemplateIterator(
    app: Application,
    env: Environment,
    builder: ElementBuilder,
    dynamicScope: DynamicScope,
    self: PathReference<unknown>
  ): Promise<TemplateIterator> {
    let resolver = new RuntimeResolver(app);

    resolver.registerTemplate('main', mainTemplate);
    resolver.registerInternalHelper('action', actionHelper);
    resolver.registerHelper('if', ifHelper);

    let context = JitContext(new ResolverDelegateImpl(resolver));
    let runtime = CustomJitRuntime(resolver, context, app.env);

    let mainLayout = templateFactory(mainTemplate).create();

    return Promise.resolve(
      renderJitMain(
        runtime,
        context,
        self,
        builder,
        mainLayout.asLayout().compile(context),
        dynamicScope
      )
    );
  }

  getComponentTemplateIterator(
    app: BaseApplication,
    env: Environment,
    builder: ElementBuilder,
    componentName: string,
    args: RenderComponentArgs
  ): Promise<TemplateIterator> {
    throw new Error('Method not implemented.');
  }
}
