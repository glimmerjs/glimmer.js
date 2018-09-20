import { assert } from "@glimmer/util";
import { metaFor, trackedGet } from "./tracked";
import { CURRENT_TAG } from "@glimmer/reference";

export interface Bounds {
  firstNode: Node;
  lastNode: Node;
}

/**
 * The `Component` class defines an encapsulated UI element that is rendered to
 * the DOM. A component is made up of a template and, optionally, this component
 * object.
 *
 * ## Defining a Component
 *
 * To define a component, subclass `Component` and add your own properties,
 * methods and lifecycle hooks:
 *
 * ```ts
 * import Component from '@glimmer/component';
 *
 * export default class extends Component {
 * }
 * ```
 *
 * ## Lifecycle Hooks
 *
 * Lifecycle hooks allow you to respond to changes to a component, such as when
 * it gets created, rendered, updated or destroyed. To add a lifecycle hook to a
 * component, implement the hook as a method on your component subclass.
 *
 * For example, to be notified when Glimmer has rendered your component so you
 * can attach a legacy jQuery plugin, implement the `didInsertElement()` method:
 *
 * ```ts
 * import Component from '@glimmer/component';
 *
 * export default class extends Component {
 *   didInsertElement() {
 *     $(this.element).pickadate();
 *   }
 * }
 * ```
 *
 * ## Data for Templates
 *
 * `Component`s have two different kinds of data, or state, that can be
 * displayed in templates:
 *
 * 1. Arguments
 * 2. Properties
 *
 * Arguments are data that is passed in to a component from its parent
 * component. For example, if I have a `UserGreeting` component, I can pass it
 * a name and greeting to use:
 *
 * ```hbs
 * <UserGreeting @name="Ricardo" @greeting="Olá" />
 * ```
 *
 * Inside my `UserGreeting` template, I can access the `@name` and `@greeting`
 * arguments that I've been given:
 *
 * ```hbs
 * {{@greeting}}, {{@name}}!
 * ```
 *
 * Arguments are also available inside my component:
 *
 * ```ts
 * console.log(this.args.greeting); // prints "Olá"
 * ```
 *
 * Properties, on the other hand, are internal to the component and declared in
 * the class. You can use properties to store data that you want to show in the
 * template, or pass to another component as an argument.
 *
 * ```ts
 * import Component from '@glimmer/component';
 *
 * export default class extends Component {
 *   user = {
 *     name: 'Robbie'
 *   }
 * }
 * ```
 *
 * In the above example, we've defined a component with a `user` property that
 * contains an object with its own `name` property.
 *
 * We can render that property in our template:
 *
 * ```hbs
 * Hello, {{user.name}}!
 * ```
 *
 * We can also take that property and pass it as an argument to the
 * `UserGreeting` component we defined above:
 *
 * ```hbs
 * <UserGreeting @greeting="Hello" @name={{user.name}} />
 * ```
 *
 * ## Arguments vs. Properties
 *
 * Remember, arguments are data that was given to your component by its parent
 * component, and properties are data your component has defined for itself.
 *
 * You can tell the difference between arguments and properties in templates
 * because arguments always start with an `@` sign (think "A is for arguments"):
 *
 * ```hbs
 * {{@firstName}}
 * ```
 *
 * We know that `@firstName` came from the parent component, not the current
 * component, because it starts with `@` and is therefore an argument.
 *
 * On the other hand, if we see:
 *
 * ```hbs
 * {{name}}
 * ```
 *
 * We know that `name` is a property on the component. If we want to know where
 * the data is coming from, we can go look at our component class to find out.
 *
 * Inside the component itself, arguments always show up inside the component's
 * `args` property. For example, if `{{@firstName}}` is `Tom` in the template,
 * inside the component `this.args.firstName` would also be `Tom`.
 */
class Component {
  /**
   * Contains the first and last DOM nodes of a component's rendered template.
   * These nodes can be used to traverse all of the DOM nodes that belong to a
   * particular component.
   *
   * Note that a component's first and last nodes *can* change over time, if the
   * beginning or ending of the template is dynamic. You should always access
   * `bounds` directly at the time a node is needed to ensure you are acting on
   * up-to-date nodes.
   *
   * ### Examples
   *
   * For components with a single root element, `this.bounds.firstNode` and
   * `this.bounds.lastNode` are the same.
   *
   * ```hbs
   * <div class="user-profile">
   *   <Avatar @user={{user}} />
   * </div>
   * ```
   *
   * ```ts
   * export default class extends Component {
   *   didInsertElement() {
   *     let { firstNode, lastNode } = this.bounds;
   *     console.log(firstNode === lastNode); // true
   *     console.log(firstNode.className); // "user-profile"
   *   }
   * }
   * ```
   *
   * For components with multiple root nodes, `this.bounds.firstNode` refers to
   * the first node in the template and `this.bounds.lastNode` refers to the
   * last:
   *
   * ```hbs
   * Welcome to Glimmer.js!
   * <span>Let's build some components!</span>
   * <img src="logo.png">
   * ```
   *
   * ```ts
   * export default class extends Component {
   *   didInsertElement() {
   *     let { firstNode, lastNode } = this.bounds;
   *
   *     // Walk all of the DOM siblings from the
   *     // firstNode to the lastNode and push their
   *     // nodeName into an array.
   *     let node = firstNode;
   *     let names = [firstNode.nodeName];
   *     do {
   *       node = node.nextSibling;
   *       names.push(node.nodeName);
   *     } while (node !== lastNode);
   *
   *     console.log(names);
   *     // ["#text", "SPAN", "IMG"]
   *   }
   * }
   * ```
   *
   * The bounds can change if the template has dynamic content at the beginning
   * or the end:
   *
   * ```hbs
   * {{#if user.isAdmin}}
   *   <span class="warning">Admin</span>
   * {{else}}
   *   Normal User
   * {{/if}}
   * ```
   *
   * In this example, the `firstNode` will change between a `span` element and a
   * `TextNode` as the `user.isAdmin` property changes.
   */
  bounds: Bounds;

  /**
   * The element corresponding to the main element of the component's template.
   * The main element is the element in the template that has `...attributes` set on it:
   *
   * ```hbs
   * <h1>Modal</h1>
   * <div class="contents" ...attributes>
   *   {{yield}}
   * </div>
   * ```
   *
   * In this example, `this.element` would be the `div` with the class `contents`.
   *
   * You should not try to access this property until after the component's `didInsertElement()`
   * lifecycle hook is called.
   */
  get element(): HTMLElement {
    let { bounds } = this;
    assert(bounds && bounds.firstNode === bounds.lastNode, `The 'element' property can only be accessed on components that contain a single root element in their template. Try using 'bounds' instead to access the first and last nodes.`);
    return bounds.firstNode as HTMLElement;
  }

  /**
   * Development-mode only name of the component, useful for debugging.
   */
  debugName: string | null = null;

  /**
   * Named arguments passed to the component from its parent component.
   * They can be accessed in JavaScript via `this.args.argumentName` and in the template via `@argumentName`.
   *
   * Say you have the following component, which will have two `args`, `firstName` and `lastName`:
   *
   * ```hbs
   * <my-component @firstName="Arthur" @lastName="Dent" />
   * ```
   *
   * If you needed to calculate `fullName` by combining both of them, you would do:
   *
   * ```ts
   * didInsertElement() {
   *   console.log(`Hi, my full name is ${this.args.firstName} ${this.args.lastName}`);
   * }
   * ```
   *
   * While in the template you could do:
   *
   * ```hbs
   * <p>Welcome, {{@firstName}} {{@lastName}}!</p>
   * ```
   *
   */
  get args() {
    trackedGet(this, 'args');
    return this.__args__;
  }

  set args(args) {
    this.__args__ = args;
    metaFor(this).updatableTagFor("args").inner.update(CURRENT_TAG);
  }

  /** @private
   * Slot on the component to save Arguments object passed to the `args` setter.
   */
  private __args__: any = null;

  static create(injections: any) {
    return new this(injections);
  }

  /**
   * Constructs a new component and assigns itself the passed properties. You
   * should not construct new components yourself. Instead, Glimmer will
   * instantiate new components automatically as it renders.
   *
   * @param options
   */
  constructor(options: object) {
    Object.assign(this, options);
  }

  /**
   * Called when the component has been inserted into the DOM.
   * Override this function to do any set up that requires an element in the document body.
   */
  didInsertElement() { }

  /**
   * Called when the component has updated and rerendered itself.
   * Called only during a rerender, not during an initial render.
   */
  didUpdate() { }

  /**
   * Called before the component has been removed from the DOM.
   */
  willDestroy() { }

  destroy() {
    this.willDestroy();
  }

  toString() {
    return `${this.debugName} component`;
  }
}

export default Component;

export interface ComponentFactory {
  create(injections: object): Component;
}
