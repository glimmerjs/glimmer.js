import { Environment, ElementBuilder, templateFactory } from '@glimmer/runtime';
import { Resolver } from '@glimmer/di';
import { Macros, CompileTimeLookup as ICompileTimeLookup, LazyOpcodeBuilder, OpcodeBuilderConstructor,} from '@glimmer/opcode-compiler';

import Application from '../application';
import Loader from './loader';
import mainTemplate from '../templates/main';
import RuntimeResolver from '../runtime-resolver';
import { Program, LazyConstants } from '@glimmer/program';

export default class RuntimeLoader implements Loader {
  constructor(protected resolver: Resolver) {
  }

  getTemplateIterator(app: Application, env: Environment, builder: ElementBuilder) {
    let resolver = new RuntimeResolver(app);
    let program = new Program(new LazyConstants(resolver));
    let macros = new Macros();
    let lookup = new CompileTimeLookup(resolver);

    let compileOptions = {
      program,
      macros,
      lookup,
      Builder: LazyOpcodeBuilder as OpcodeBuilderConstructor
    };

    let mainLayout = templateFactory(mainTemplate).create(compileOptions);

    return mainLayout.renderLayout({
      env,
      self,
      dynamicScope,
      builder: elementBuilder
    });
  }
}

class CompileTimeLookup implements ICompileTimeLookup<Specifier> {
  constructor(private resolver: RuntimeResolver) {}

  private getComponentDefinition(handle: number): ComponentDefinition {
    let spec = this.resolver.resolve<Option<ComponentDefinition>>(handle);

    assert(!!spec, `Couldn't find a template for ${handle}`);

    return spec!;
  }

  getCapabilities(handle: number): ComponentCapabilities {
    let definition = this.getComponentDefinition(handle);
    let { manager, state } = definition!;
    return manager.getCapabilities(state);
  }

  getLayout(handle: number): ICompilableTemplate<ProgramSymbolTable> {
    let definition = this.getComponentDefinition(handle);
    let { manager } = definition;
    let invocation = (manager as WithStaticLayout<any, any, Specifier, RuntimeResolver>).getLayout(definition, this.resolver);

    return {
      compile() { return invocation.handle; },
      symbolTable: invocation.symbolTable
    };
  }

  lookupHelper(name: string, referrer: Specifier): Option<number> {
    return this.resolver.lookupHelper(name, referrer);
  }

  lookupModifier(name: string, referrer: Specifier): Option<number> {
    return this.resolver.lookupModifier(name, referrer);
  }

  lookupComponentSpec(name: string, referrer: Specifier): Option<number> {
    return this.resolver.lookupComponentHandle(name, referrer);
  }

  lookupPartial(name: string, referrer: Specifier): Option<number> {
    return this.resolver.lookupPartial(name, referrer);
  }
}
