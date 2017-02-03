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
import {
  DynamicScope,
  Environment
} from '@glimmer/component';
import {
  Simple,
  templateFactory
} from '@glimmer/runtime';

function isTypeSpecifier(specifier: string) {
  return specifier.indexOf(':') === -1;
}

export interface ApplicationOptions {
  rootName: string;
  rootElement?: Simple.Element;
  resolver?: Resolver;
}

export default class Application implements Owner {
  public rootName: string;
  public rootElement: any;
  public resolver: Resolver;
  public env: Environment;
  private _registry: Registry;
  private _container: Container;
  private _renderResult: any; // TODO - type

  constructor(options: ApplicationOptions) {
    this.rootName = options.rootName;
    this.rootElement = options.rootElement;
    this.resolver = options.resolver;

    this._registry = new Registry();
    this._container = new Container(this._registry, this.resolver);

    // Inject `this` (the app) as the "owner" of every object instantiated
    // by its container.
    this._container.defaultInjections = (specifier: string) => {
      let hash = {};
      setOwner(hash, this);
      return hash;
    }

    this.initRegistrations();
  }

  initRegistrations(): void {
    this.register(`environment:/${this.rootName}/main/main`, Environment);
    this.registerOption('template', 'instantiate', false);
  }

  boot(): void {
    this.env = this.lookup(`environment:/${this.rootName}/main/main`);

    if (!this.rootElement) {
      this.rootElement = this.env.getDOM().createElement('div');
      self.document.body.append(this.rootElement);
    }

    this.render();
  }

  render() {
    this.env.begin();

    let mainTemplate = this.lookup(`template:/${this.rootName}/components/main`);
    let mainLayout = templateFactory(mainTemplate).create(this.env);
    let result = mainLayout.render(null, this.rootElement, new DynamicScope());

    this.env.commit();

    this._renderResult = result;
  }

  rerender() {
    this.env.begin();
    this._renderResult.rerender();
    this.env.commit();
  }

  /**
   * Registry accessor methods that normalize specifiers.
   * 
   * TODO: consider converting Registry to be an interface instead of a class
   * and then extract these methods to a separate accessor class that implements
   * Registry.
   */

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

  /**
   * Owner interface implementation
   */

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

  /**
   * Private methods
   */

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
