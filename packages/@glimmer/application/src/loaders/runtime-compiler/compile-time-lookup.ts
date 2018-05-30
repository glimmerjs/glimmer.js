import {
} from "@glimmer/opcode-compiler";
import {
  ComponentDefinition as IComponentDefinition,
  CompileTimeLookup as ICompileTimeLookup,
  CompilableTemplate,
  Opaque,
  ComponentCapabilities,
  ProgramSymbolTable
} from "@glimmer/interfaces";
import { Option, assert } from "@glimmer/util";
import { WithStaticLayout, ComponentManager } from "@glimmer/runtime";

import RuntimeResolver from "./resolver";
import { Specifier } from "./loader";

type ComponentDefinition = IComponentDefinition<
  ComponentManager<Opaque, Opaque>
>;

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

  getLayout(handle: number): CompilableTemplate<ProgramSymbolTable> {
    let definition = this.getComponentDefinition(handle);
    let { manager } = definition;
    let invocation = (manager as WithStaticLayout<
      any,
      any,
      Specifier,
      RuntimeResolver
    >).getLayout(definition, this.resolver);

    return {
      compile() {
        return invocation.handle;
      },
      symbolTable: invocation.symbolTable
    };
  }

  lookupHelper(name: string, referrer: Specifier): Option<number> {
    return this.resolver.lookupHelper(name, referrer);
  }

  lookupModifier(name: string, referrer: Specifier): Option<number> {
    return this.resolver.lookupModifier(name, referrer);
  }

  lookupComponentDefinition(name: string, referrer: Specifier): Option<number> {
    return this.resolver.lookupComponentHandle(name, referrer);
  }

  lookupPartial(name: string, referrer: Specifier): Option<number> {
    return this.resolver.lookupPartial(name, referrer);
  }
}
