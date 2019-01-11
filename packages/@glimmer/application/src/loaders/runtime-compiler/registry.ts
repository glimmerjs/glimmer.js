import {
  CompileTimeResolverDelegate,
  ModuleLocator,
  Option,
  CompileTimeComponent,
  Template
} from "@glimmer/interfaces";

interface ModuleResolverDelegate {
  helper(name: string, referrer: ModuleLocator): ModuleLocator;
  modifier(name: string, referrer: ModuleLocator): ModuleLocator;
  component(name: string, referrer: ModuleLocator): ModuleLocator;
}

export class Handles {
  private byLocator: Map<string, Map<string, number>> = new Map();
  private byHandle: Map<number, ModuleLocator> = new Map();

  getHandle(locator: ModuleLocator): number {
    let named;

    if (this.byLocator.has(locator.module)) {
      named = this.byLocator.get(locator.module);
    } else {
      named = new Map();
      this.byLocator.set(locator.module, named);
    }

    if (named.has(locator.name)) {
      return named.get(locator.name);
    } else {
      let handle = this.byHandle.size;
      named.set(locator.name, handle);
      this.byHandle.set(handle, locator);
    }
  }

  getLocator(handle: number): ModuleLocator {
    return this.byHandle.get(handle);
  }
}

export class JitResolverDelegate
  implements CompileTimeResolverDelegate<ModuleLocator> {
  private handles = new Handles();

  constructor(private modules: ModuleResolverDelegate) {}

  lookupHelper(name: string, referrer: ModuleLocator): Option<number> {
    let helper = this.modules.helper(name, referrer);
    return this.handles.getHandle(helper);
  }

  lookupModifier(name: string, referrer: ModuleLocator): Option<number> {
    let modifier = this.modules.modifier(name, referrer);
    return this.handles.getHandle(modifier);
  }

  lookupComponent(
    name: string,
    referrer: ModuleLocator
  ): Option<CompileTimeComponent> {
    throw new Error("Unimplemented");
  }

  lookupPartial(_name: string, _referrer: ModuleLocator): Option<number> {
    throw new Error("Partials not supported in Glimmer.js");
  }

  // `name` is a cache key.
  // TODO: The caller should cache
  compile(source: string, name: string): Template {
    throw new Error("unimplemented");
  }

  // For debugging
  resolve(handle: number): ModuleLocator {
    throw new Error("unimplemented");
  }
}
