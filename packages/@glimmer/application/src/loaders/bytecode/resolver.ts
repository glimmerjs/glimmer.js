import { RuntimeResolver, ComponentDefinition, SymbolTable } from '@glimmer/interfaces';
import { Specifier } from '@glimmer/bundle-compiler';
import { unreachable, Opaque, expect } from '@glimmer/util';
import { ComponentManager } from '@glimmer/runtime';
import { Owner, Factory } from '@glimmer/di';
import { CAPABILITIES } from '@glimmer/component';

interface Constructor {
  new (...args: any[]): any;
}

function buildComponentDefinition(ComponentClass: Factory<Opaque>, manager: ComponentManager<Opaque, Opaque>, handle?: number, symbolTable?: SymbolTable) {
  return {
    manager,
    state: {
      handle,
      symbolTable,
      ComponentClass,
      capabilities: CAPABILITIES
    }
  };
}

/**
 * Exchanges VM handles for concrete implementations.
 */
export default class BytecodeResolver implements RuntimeResolver<Specifier> {
  constructor(protected owner: Owner, protected table: Opaque[], protected map: Map<string, number>, protected symbols: Map<string, SymbolTable>) {
  }

  lookupComponent(name: string, referrer: Specifier): ComponentDefinition {
    let owner = this.owner;

    let manager = expect(owner.lookup('component-manager:main'), 'expected to find component manager');
    let resolved = owner.identify(`template:${name}`, referrer.module);
    let layout = this.map.get(resolved);
    let symbolTable = this.symbols.get(resolved);

    let resolvedClass = owner.identify('component:', resolved);
    let ComponentClass;
    debugger;
    if (resolvedClass) {
      ComponentClass = owner.lookup(resolvedClass);
    }

    return buildComponentDefinition(ComponentClass, manager, layout, symbolTable);
  }

  lookupPartial(name: string, referrer: Specifier): number {
    throw unreachable();
  }

  resolve<U>(handle: number): U {
    console.log({ handle }, this.table[handle]);
    return this.resolveComponentDefinition(handle) as any as U;
  }

  resolveComponentDefinition(handle: number): ComponentDefinition {
    let manager = this.owner.lookup(`component-manager:main`);
    let ComponentClass = this.owner.factoryFor(`component:`, (this.table[handle] as Specifier).module);

    return buildComponentDefinition(ComponentClass, manager);
  }
}
