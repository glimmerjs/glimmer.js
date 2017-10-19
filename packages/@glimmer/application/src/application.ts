import {
  Container,
  Factory,
  Owner,
  Registry,
  RegistryWriter,
  Resolver,
  setOwner,
} from '@glimmer/di';
import {
  RenderResult
} from '@glimmer/runtime';
import {
  UpdatableReference
} from '@glimmer/object-reference';
import {
  Option
} from '@glimmer/util';
import {
  Simple
} from '@glimmer/interfaces';
import ApplicationRegistry from './application-registry';
import DynamicScope from './dynamic-scope';
import Environment from './environment';
import ApplicationDelegate, { DefaultApplicationDelegate } from './application-delegate';

export interface ApplicationOptions {
  rootName: string;
  resolver: Resolver;
  document?: Simple.Document;
  delegate?: ApplicationDelegate;
}

export interface Initializer {
  name?: string;
  initialize(registry: RegistryWriter): void;
}

export interface AppRoot {
  id: number;
  component: string;
  parent: Simple.Node;
  nextSibling: Option<Simple.Node>;
}

export interface ApplicationConstructor<T = Application> {
  new (options: ApplicationOptions): T;
}

export default class Application implements Owner {
  public rootName: string;
  public resolver: Resolver;
  public document: Simple.Document;
  public env: Environment;

  private _roots: AppRoot[] = [];
  private _rootsIndex = 0;
  private _registry: Registry;
  private _container: Container;
  private _initializers: Initializer[] = [];
  private _initialized = false;
  private _rendering = false;
  private _rendered = false;
  private _scheduled = false;
  private _result: RenderResult;

  protected delegate: ApplicationDelegate;

  constructor(options: ApplicationOptions) {
    this.rootName = options.rootName;
    this.resolver = options.resolver;
    this.document = options.document || (typeof window !== 'undefined' && window.document);
    this.delegate = options.delegate || new DefaultApplicationDelegate();
  }

  /**
   * Renders a component by name into the provided element, and optionally
   * adjacent to the provided nextSibling element.
   *
   * ## Examples
   *
   * ```js
   * app.renderComponent('MyComponent', document.body, document.getElementById('my-footer'));
   * ```
   */
  renderComponent(component: string, parent: Simple.Node, nextSibling: Option<Simple.Node> = null): void {
    this._roots.push({ id: this._rootsIndex++, component, parent, nextSibling });
    this.scheduleRerender();
  }

  /**
   * Initializes the application and renders any components that have been
   * registered via `renderComponent()`.
   */
  boot(): void {
    this.initialize();

    this.env = this.lookup(`environment:/${this.rootName}/main/main`);

    this._render();
  }

  /**
   * Schedules all components to revalidate and potentially update the DOM to
   * reflect any changes to underlying component state.
   *
   * Generally speaking, you  should avoid calling `scheduleRerender()`
   * manually. Instead, use tracked properties on components and models, which
   * invoke this method for you automatically when appropriate.
   */
  scheduleRerender(): void {
    if (this._scheduled || !this._rendered) return;

    this._rendering = true;
    this._scheduled = true;
    requestAnimationFrame(() => {
      this._scheduled = false;
      this._rerender();
      this._rendering = false;
    });
  }

  /** @hidden */
  initialize(): void {
    this.initRegistry();
    this.initContainer();
  }

  /** @hidden */
  registerInitializer(initializer: Initializer): void {
    this._initializers.push(initializer);
  }

  /**
   * @hidden
   *
   * Initializes the registry, which maps names to objects in the system. Addons
   * and subclasses can customize the behavior of a Glimmer application by
   * overriding objects in the registry.
   */
  protected initRegistry(): void {
    let registry = this._registry = new Registry();

    // Create ApplicationRegistry as a proxy to the underlying registry
    // that will only be available during `initialize`.
    let appRegistry = new ApplicationRegistry(this._registry, this.resolver);

    registry.register(`environment:/${this.rootName}/main/main`, Environment);
    registry.registerOption('helper', 'instantiate', false);
    registry.registerOption('template', 'instantiate', false);
    registry.register(`document:/${this.rootName}/main/main`, this.document as any);
    registry.registerOption('document', 'instantiate', false);
    registry.registerInjection('environment', 'document', `document:/${this.rootName}/main/main`);
    registry.registerInjection('component-manager', 'env', `environment:/${this.rootName}/main/main`);

    let initializers = this._initializers;
    for (let i = 0; i < initializers.length; i++) {
      initializers[i].initialize(appRegistry);
    }

    this._initialized = true;
  }

  /**
   * @hidden
   *
   * Initializes the container, which stores instances of objects that come from
   * the registry.
   */
  protected initContainer(): void {
    this._container = new Container(this._registry, this.resolver);

    // Inject `this` (the app) as the "owner" of every object instantiated
    // by its container.
    this._container.defaultInjections = (specifier: string) => {
      let hash = {};
      setOwner(hash, this);
      return hash;
    };
  }

  /** @hidden
   *
   * Ensures the DOM is up-to-date by performing a revalidation on the root
   * template's render result. This method should not be called directly;
   * instead, any mutations in the program that could cause side-effects should
   * call `scheduleRerender()`, which ensures that DOM updates only happen once
   * at the end of the browser's event loop.
   */
  protected _rerender() {
    let { env, _result: result } = this;

    if (!result) {
      throw new Error('Cannot re-render before initial render has completed');
    }

    env.begin();
    result.rerender();
    env.commit();

    this._didRender();
  }

  /** @hidden */
  protected _render(): void {
    let { env } = this;

    // Create the template context for the root `main` template, which just
    // contains the array of component roots. Any property references in that
    // template will be looked up from this object.
    let self = new UpdatableReference({ roots: this._roots });

    // Create an empty root scope.
    let dynamicScope = new DynamicScope();
    let elementBuilder = this.delegate.elementBuilder(env, this.document);

    let templateIterator = this.delegate.prepareMainLayout(env, self, dynamicScope, elementBuilder);

    // Begin a new transaction. The transaction stores things like component
    // lifecycle events so they can be flushed once rendering has completed.
    env.begin();

    let result = this.delegate.render(templateIterator);

    // Finally, commit the transaction and flush component lifecycle hooks.
    env.commit();

    this._result = result;
    this._didRender();
  }

  _didRender(): void {
    this._rendered = true;
  }

  /**
   * Owner interface implementation
   *
   * @hidden
   */
  identify(specifier: string, referrer?: string): string {
    return this.resolver.identify(specifier, referrer);
  }

  /** @hidden */
  factoryFor(specifier: string, referrer?: string): Factory<any> {
    return this._container.factoryFor(this.identify(specifier, referrer));
  }

  /** @hidden */
  lookup(specifier: string, referrer?: string): any {
    return this._container.lookup(this.identify(specifier, referrer));
  }
}
