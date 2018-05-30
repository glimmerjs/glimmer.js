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
  ElementBuilder,
  TemplateIterator,
  Environment as AbstractEnvironment
} from '@glimmer/runtime';
import {
  UpdatableReference
} from '@glimmer/component';
import {
  Option, assert
} from '@glimmer/util';
import {
  Simple, Opaque
} from '@glimmer/interfaces';
import { PathReference } from '@glimmer/reference';

import ApplicationRegistry from './application-registry';
import DynamicScope from './dynamic-scope';
import Environment from './environment';

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
  getBuilder(env: AbstractEnvironment): ElementBuilder;
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
  getTemplateIterator(app: Application, env: Environment, builder: ElementBuilder, dynamicScope: DynamicScope, self: PathReference<Opaque>): Promise<TemplateIterator>;
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
 * Options for configuring an instance of [Application].
 *
 * @public
 */
export interface ApplicationOptions {
  builder: Builder;
  loader: Loader;
  renderer: Renderer;
  rootName: string;
  resolver?: Resolver;
  document?: Simple.Document;
}

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
 * A data structure created when a root Glimmer component is rendered into the
 * DOM via the [Application#renderComponent] method.
 *
 * @internal
 */
export interface AppRoot {
  id: number;
  component: string;
  parent: Simple.Node;
  nextSibling: Option<Simple.Node>;
}

/** @internal */
export interface ApplicationConstructor<T = Application> {
  new (options: ApplicationOptions): T;
}

/** @internal */
export type Notifier = [() => void, (err: Error) => void];

const DEFAULT_DOCUMENT = typeof document === 'object' ? document : null;

/**
 * The central control point for starting and running Glimmer components.
 *
 * @public
 */
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

  /** @hidden
   * The root Reference whose value provides the context of the main template.
   */
  private _self: UpdatableReference<{ roots: AppRoot[] }>;

  protected _rendering = false;
  protected _rendered = false;
  protected _scheduled = false;

  protected builder: Builder;
  protected loader: Loader;
  protected renderer: Renderer;

  protected _notifiers: Notifier[] = [];

  constructor(options: ApplicationOptions) {
    this.rootName = options.rootName;
    this.resolver = options.resolver;

    assert(options.loader, 'Must provide a Loader for preparing templates and other metadata required for a Glimmer Application.');
    assert(options.renderer, 'Must provide a Renderer to render the templates produced by the Loader.');
    assert(options.builder, 'Must provide a Builder that is responsible to building DOM.');

    this.document = options.document || DEFAULT_DOCUMENT;
    this.loader = options.loader;
    this.renderer = options.renderer;
    this.builder = options.builder;
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
    let { _roots: roots, _self: self } = this;

    roots.push({ id: this._rootsIndex++, component, parent, nextSibling });

    // If we've already rendered, need to invalidate the root reference and
    // schedule a re-render for the new component to appear in DOM.
    if (self) {
      self.update({ roots });
      this.scheduleRerender();
    }
  }

  /**
   * Initializes the application and renders any components that have been
   * registered via [renderComponent].
   *
   * @public
   */
  async boot(): Promise<void> {
    this.initialize();

    this.env = this.lookup(`environment:/${this.rootName}/main/main`);

    await this._render();
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
    setTimeout(() => {
      this._scheduled = false;
      this._rerender();
      this._rendering = false;
    }, 0);
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

  /** @internal */
  protected async _render(): Promise<void> {
    let { env } = this;

    // Create the template context for the root `main` template, which just
    // contains the array of component roots. Any property references in that
    // template will be looked up from this object.
    let self = this._self = new UpdatableReference({ roots: this._roots });

    // Create an empty root scope.
    let dynamicScope = new DynamicScope();

    let builder = this.builder.getBuilder(env);
    let templateIterator = await this.loader.getTemplateIterator(this, env, builder, dynamicScope, self);

    try {
      // Begin a new transaction. The transaction stores things like component
      // lifecycle events so they can be flushed once rendering has completed.
      env.begin();

      await this.renderer.render(templateIterator);

      // Finally, commit the transaction and flush component lifecycle hooks.
      env.commit();

      this._didRender();
    } catch (err) {
      this._didError(err);
    }
  }

  /**
   * Ensures the DOM is up-to-date by performing a revalidation on the root
   * template's render result. This method should not be called directly;
   * instead, any mutations in the program that could cause side-effects should
   * call `scheduleRerender()`, which ensures that DOM updates only happen once
   * at the end of the browser's event loop.
   *
   * @internal
   */
  protected async _rerender() {
    let { env } = this;

    try {
      env.begin();
      await this.renderer.rerender();
      env.commit();

      this._didRender();
    } catch (err) {
      this._didError(err);
    }
  }

  protected _didRender(): void {
    this._rendered = true;

    let notifiers = this._notifiers;
    this._notifiers = [];

    notifiers.forEach(n => n[0]());
  }

  protected _didError(err: Error): void {
    let notifiers = this._notifiers;
    this._notifiers = [];

    notifiers.forEach(n => n[1](err));
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
