import {
  Container,
  Factory,
  Owner,
  Registry,
  RegistryAccessor,
  Resolver,
  setOwner
} from '@glimmer/di';
import {
  Simple,
  templateFactory
} from '@glimmer/runtime';
import ApplicationRegistry from './application-registry';
import DynamicScope from './dynamic-scope';
import Environment from './environment';

export interface ApplicationOptions {
  rootName: string;
  rootElement?: Simple.Element;
  resolver: Resolver;
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
    
    this.initRegistry();
  }

  initRegistry(): void {
    this._registry = new Registry();

    // Create ApplicationRegistry as a proxy to the underlying registry
    // that will only be available during `initialize`.
    let appRegistry = new ApplicationRegistry(this._registry, this.resolver);
    this.initialize(appRegistry);
  }

  initialize(registry: RegistryAccessor): void {
    registry.register(`environment:/${this.rootName}/main/main`, Environment);
    registry.registerOption('template', 'instantiate', false);

    // Override and extend to perform custom registrations
  }

  initContainer(): void {
    this._container = new Container(this._registry, this.resolver);

    // Inject `this` (the app) as the "owner" of every object instantiated
    // by its container.
    this._container.defaultInjections = (specifier: string) => {
      let hash = {};
      setOwner(hash, this);
      return hash;
    }
  }

  boot(): void {
    this.initContainer();

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
   * Owner interface implementation
   */

  identify(specifier: string, referrer?: string): string {
    return this.resolver.identify(specifier, referrer);
  }

  factoryFor(specifier: string, referrer?: string): Factory<any> {
    return this._container.factoryFor(this.identify(specifier, referrer));
  }

  lookup(specifier: string, referrer?: string): any {
    return this._container.lookup(this.identify(specifier, referrer));
  }
}
