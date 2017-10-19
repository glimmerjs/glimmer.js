import { CompileTimeLookup as ICompileTimeLookup, ICompilableTemplate } from '@glimmer/opcode-compiler';
import { ComponentDefinition as IComponentDefinition, Opaque, ComponentCapabilities, ProgramSymbolTable } from '@glimmer/interfaces';
import { Option, assert } from '@glimmer/util';

import RuntimeResolver from './runtime-resolver';
import { Specifier } from '../loaders/runtime-loader';
import { WithStaticLayout, ComponentManager } from '@glimmer/runtime';

type ComponentDefinition = IComponentDefinition<ComponentManager<Opaque, Opaque>>;

export default class CompileTimeLookup implements ICompileTimeLookup<Specifier> {
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
