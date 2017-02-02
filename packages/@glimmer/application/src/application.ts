import {
  Container,
  Factory,
  isSpecifierStringAbsolute,
  Owner,
  Registry,
  Resolver,
  RegistrationOptions,
  setOwner
} from '@glimmer/di';

function isTypeSpecifier(specifier: string) {
  return specifier.indexOf(':') === -1;
}

export default class Application implements Owner {
  public resolver: Resolver;
  private _registry: Registry;
  private _container: Container;

  constructor(resolver?: Resolver) {
    this.resolver = resolver;
    this._registry = new Registry();
    this._container = new Container(this._registry, resolver);

    // Inject `this` (the app) as the "owner" of every object instantiated
    // by its container.
    this._container.defaultInjections = (specifier: string) => {
      let hash = {};
      setOwner(hash, this);
      return hash;
    }
  }

  register(specifier: string, factory: any, options?: RegistrationOptions): void {
    let normalizedSpecifier = this._toAbsoluteSpecifier(specifier);
    this._registry.register(normalizedSpecifier, factory, options);
  }

  registration(specifier: string): any {
    let normalizedSpecifier = this._toAbsoluteSpecifier(specifier);
    return this._registry.registration(normalizedSpecifier);
  }

  unregister(specifier: string) {
    let normalizedSpecifier = this._toAbsoluteSpecifier(specifier);
    this._registry.unregister(normalizedSpecifier);
  }

  registerOption(specifier: string, option: string, value: any): void {
    let normalizedSpecifier = this._toAbsoluteOrTypeSpecifier(specifier);
    this._registry.registerOption(normalizedSpecifier, option, value);
  }

  registeredOption(specifier: string, option: string): any {
    let normalizedSpecifier = this._toAbsoluteOrTypeSpecifier(specifier);
    return this._registry.registeredOption(normalizedSpecifier, option);
  }

  registeredOptions(specifier: string): any {
    let normalizedSpecifier = this._toAbsoluteOrTypeSpecifier(specifier);
    return this._registry.registeredOptions(normalizedSpecifier);
  }

  unregisterOption(specifier: string, option: string): void {
    let normalizedSpecifier = this._toAbsoluteOrTypeSpecifier(specifier);
    this._registry.unregisterOption(normalizedSpecifier, option);
  }

  registerInjection(specifier: string, property: string, injection: string): void {
    let normalizedSpecifier = this._toAbsoluteOrTypeSpecifier(specifier);
    let normalizedInjection = this._toAbsoluteSpecifier(injection);
    this._registry.registerInjection(normalizedSpecifier, property, normalizedInjection);
  }

  identify(specifier: string, referrer?: string): string {
    return this._toAbsoluteSpecifier(specifier, referrer);
  }

  factoryFor(specifier: string, referrer?: string): Factory<any> {
    let absoluteSpecifier = this._toAbsoluteSpecifier(specifier, referrer);
    return this._container.factoryFor(absoluteSpecifier);
  }

  lookup(specifier: string, referrer?: string): any {
    let absoluteSpecifier = this._toAbsoluteSpecifier(specifier, referrer);
    return this._container.lookup(absoluteSpecifier);
  }

  private _toAbsoluteSpecifier(specifier: string, referrer?: string): string {
    if (isSpecifierStringAbsolute(specifier)) {
      return specifier;
    } else {
      return this.resolver.identify(specifier, referrer);
    }
  }

  private _toAbsoluteOrTypeSpecifier(specifier: string): string {
    if (isTypeSpecifier(specifier)) {
      return specifier;
    } else {
      return this._toAbsoluteSpecifier(specifier);
    }
  }
}
