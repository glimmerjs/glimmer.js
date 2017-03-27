import { Simple } from '@glimmer/runtime';

/**
 * A `Component` is an isolated element that is composed by two parts, the class and the template.
 * While the template file is required, the class file is optional if your template is simple enough to skip it.
 *
 * ## Properties and arguments
 *
 * `Component`s have two different kinds of state, properties and arguments.
 * Properties are internal to the component and declared in the class.
 * Arguments are any data passed to the component in the template.
 *
 * This distinction avoids name collisions between internal and external data to the component.
 * Let's see an example:
 *
 * If you have the following component class:
 *
 * ```ts
 * import Component from '@glimmer/component';
 *
 * export default class extends Component {
 *   spelling = "potato"
 * }
 * ```
 *
 * And template:
 *
 * ```hbs
 * <div>You say {{@spelling}}, I say {{spelling}}.</div>
 * ```
 *
 * When you render the component like so:
 *
 * ```hbs
 * <my-component @spelling="poteto" />
 * ```
 *
 * You will see it render:
 *
 * ```html
 * <div>You say poteto, I say potato.</div>
 * ```
 */
class Component {
  /**
   * The element corresponding to the top-level element of the component's template.
   */
  element: Simple.Element = null;

  /**
   * Development-mode only name of the component, useful for debugging.
   */
  debugName: string = null;

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
   *   console.log("Hi,My full name is ${this.args.firstName} ${this.args.lastName");
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
  args: object;

  static create(injections: any) {
    return new this(injections);
  }

  constructor(injections: object) {
    Object.assign(this, injections);
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

  toString() {
    return `${this.debugName} component`;
  }
}

export default Component;

export interface ComponentFactory {
  create(injections: object): Component;
}
