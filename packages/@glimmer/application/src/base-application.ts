import {
  Container,
  Factory,
  Owner,
  Registry,
  Resolver,
  setOwner,
  FactoryDefinition,
  RegistryWriter
} from "@glimmer/di";

import { PathReference } from "@glimmer/reference";

import { RenderComponentArgs } from "@glimmer/runtime";

import { assert } from "@glimmer/util";

import ApplicationRegistry from "./application-registry";
import {
  DynamicScope,
  TemplateIterator,
  ElementBuilder,
  Environment
} from "@glimmer/interfaces";
import { SimpleDocument } from "@simple-dom/interface";

/**
 * Initializers run when an [Application] boots and allow extending the
 * application with additional functionality. See
 * [Application#registerInitializer].
 *
 * @public
 */
export interface Initializer {
  name?: string;
  initialize(registry: RegistryWriter): void;
}

/**
 * A Builder encapsulates the building of template output. For example, in the
 * browser a builder might construct DOM elements, while on the server it may
 * instead construct HTML. An object implementing the Builder interface should
 * return a concrete instance of an ElementBuilder from its getBuilder method.
 *
 * @public
 */
export interface Builder {
  /**
   * Returns a concrete instance of an ElementBuilder for the given Environment.
   */
  getBuilder(env: Environment): ElementBuilder;
}

/**
 * Loaders are responsible for loading and preparing all of the templates and
 * other metadata required to get a Glimmer.js application into a functioning
 * state.
 *
 * @public
 */
export interface Loader {
  /**
   * Returns a template iterator for on the provided application state.
   */
  getTemplateIterator(
    app: BaseApplication,
    env: Environment,
    builder: ElementBuilder,
    dynamicScope: DynamicScope,
    self: PathReference<unknown>
  ): Promise<TemplateIterator>;

  /**
   * Returns a template iterator for the specified component with the specified arguments
   */
  getComponentTemplateIterator(
    app: BaseApplication,
    env: Environment,
    builder: ElementBuilder,
    componentName: string,
    args: RenderComponentArgs
  ): Promise<TemplateIterator>;
}

/**
 * Renderers are responsible for iterating over the template iterator returned
 * from a Loader, and re-rendering when component state has been invalidated.
 * The Renderer may be either synchronous or asynchronous, and controls its own
 * scheduling.
 *
 * @public
 */
export interface Renderer {
  /**
   * Responsible for iterating over the passed template iterator until no more
   * values remain. If this process is asynchronous, should return a promise
   * that resolves once the iterator is exhausted.
   */
  render(iterator: TemplateIterator): void | Promise<void>;

  /**
   * Revalidates the initial render result. Called any time any component state
   * may have changed.
   */
  rerender(): void | Promise<void>;
}

/**
 * Options needed for setting up a base Glimmer application with Dependency Injection.
 * Dependency Injection is at the core of any Glimmer application. Specifically it sets up the environment and what other parts of the application depend on it.
 *
 * @internal
 */
export interface BaseApplicationOptions {
  rootName: string;
  resolver: Resolver;
  environment: FactoryDefinition<Environment>;
  loader: Loader;
  renderer: Renderer;
}

/**
 * A base application class that can be shared across different Glimmer application implementations.
 * It sets up dependency injection and other configuration.
 * For example, this base class can be reused across a server-side Glimmer application and a client-side Glimmer application.
 *
 * @internal
 */
export default abstract class BaseApplication implements Owner {
  public rootName: string;
  public resolver: Resolver;
  readonly document: SimpleDocument;

  private _registry: Registry;
  private _container: Container;
  private _initializers: Initializer[] = [];
  private _environment: FactoryDefinition<Environment>;

  protected loader: Loader;
  protected renderer: Renderer;

  constructor({
    rootName,
    resolver,
    environment,
    loader,
    renderer
  }: BaseApplicationOptions) {
    this.resolver = resolver;
    this.rootName = rootName;
    this._environment = environment;

    assert(
      loader,
      "Must provide a Loader for preparing templates and other metadata required for a Glimmer Application."
    );
    assert(
      renderer,
      "Must provide a Renderer to render the templates produced by the Loader."
    );

    this.loader = loader;
    this.renderer = renderer;
  }

  /** @internal */
  initialize(): void {
    this.initRegistry();
    this.initContainer();
  }

  /** @internal */
  registerInitializer(initializer: Initializer): void {
    this._initializers.push(initializer);
  }

  /**
   * Initializes the registry, which maps names to objects in the system. Addons
   * and subclasses can customize the behavior of a Glimmer application by
   * overriding objects in the registry.
   *
   * @internal
   */
  protected initRegistry(): void {
    let registry = (this._registry = new Registry());

    // Create ApplicationRegistry as a proxy to the underlying registry
    // that will only be available during `initialize`.
    let appRegistry = new ApplicationRegistry(this._registry, this.resolver);

    registry.register(
      `environment:/${this.rootName}/main/main`,
      this._environment
    );
    registry.registerOption("helper", "instantiate", false);
    registry.registerOption("template", "instantiate", false);
    registry.registerInjection(
      "environment",
      "document",
      `document:/${this.rootName}/main/main`
    );
    registry.registerInjection(
      "component-manager",
      "env",
      `environment:/${this.rootName}/main/main`
    );

    let initializers = this._initializers;
    for (let i = 0; i < initializers.length; i++) {
      initializers[i].initialize(appRegistry);
    }
  }

  /**
   * Initializes the container, which stores instances of objects that come from
   * the registry.
   *
   * @internal
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

  /**
   * Owner interface implementation
   *
   * @internal
   */
  identify(specifier: string, referrer?: string): string {
    return this.resolver.identify(specifier, referrer);
  }

  /** @internal */
  factoryFor(specifier: string, referrer?: string): Factory<any> {
    return this._container.factoryFor(this.identify(specifier, referrer));
  }

  /** @internal */
  lookup(specifier: string, referrer?: string): any {
    return this._container.lookup(this.identify(specifier, referrer));
  }
}
