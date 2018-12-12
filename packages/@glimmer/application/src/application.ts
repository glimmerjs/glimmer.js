import {
  Resolver
} from '@glimmer/di';
import {
  UpdatableReference
} from '@glimmer/component';
import {
  Option, assert
} from '@glimmer/util';
import {
  Simple
} from '@glimmer/interfaces';

import BaseApplication, { Builder, Loader, Renderer } from './base-application';
import DynamicScope from './dynamic-scope';
import Environment from './environment';

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

const DEFAULT_DOCUMENT = typeof document === 'object' ? document as Simple.Document : null;

/**
 * The central control point for starting and running Glimmer components.
 *
 * @public
 */
export default class Application extends BaseApplication {
  public document: Simple.Document;
  public env: Environment;

  private _roots: AppRoot[] = [];
  private _rootsIndex = 0;

  /** @hidden
   * The root Reference whose value provides the context of the main template.
   */
  private _self: UpdatableReference<{ roots: AppRoot[] }>;

  protected _rendering = false;
  protected _rendered = false;
  protected _scheduled = false;

  protected builder: Builder;
  protected _notifiers: Notifier[] = [];

  constructor(options: ApplicationOptions) {
    super({
      rootName: options.rootName,
      resolver: options.resolver,
      environment: Environment,
      loader: options.loader,
      renderer: options.renderer
    });

    assert(options.builder, 'Must provide a Builder that is responsible to building DOM.');
    const document = this.document = options.document || DEFAULT_DOCUMENT;
    this.builder = options.builder;

    this.registerInitializer({
      initialize(registry) {
        registry.register(`document:/${options.rootName}/main/main`, document);
        registry.registerOption('document', 'instantiate', false);
      }
    });
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
    setTimeout(async () => {
      this._scheduled = false;
      await this._rerender();
      this._rendering = false;
    }, 0);
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
}
