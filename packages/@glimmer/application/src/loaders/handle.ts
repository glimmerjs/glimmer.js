import { ModuleLocator } from "@glimmer/interfaces";

export class LocatorHandles {
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
      return handle;
    }
  }

  getLocator(handle: number): ModuleLocator {
    return this.byHandle.get(handle);
  }
}

export class IdentityHandles<T> {
  private byLocator: Map<T, number> = new Map();
  private byHandle: Map<number, T> = new Map();

  getHandle(identity: T): number {
    if (this.byLocator.has(identity)) {
      return this.byLocator.get(identity);
    } else {
      let handle = this.byHandle.size;
      this.byLocator.set(identity, handle);
      this.byHandle.set(handle, identity);
      return handle;
    }
  }

  getLocator(handle: number): T {
    return this.byHandle.get(handle);
  }
}
