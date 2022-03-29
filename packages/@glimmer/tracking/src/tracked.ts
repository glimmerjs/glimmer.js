import { DEBUG } from '@glimmer/env';
import { trackedData } from '@glimmer/validator';

/**
 * @decorator
 *
 * Marks a property as tracked.
 *
 * By default, a component's properties are expected to be static,
 * meaning you are not able to update them and have the template update accordingly.
 * Marking a property as tracked means that when that property changes,
 * a rerender of the component is scheduled so the template is kept up to date.
 *
 * @example
 *
 * ```typescript
 * import Component from '@glimmer/component';
 * import { tracked } from '@glimmer/tracking';
 *
 * export default class MyComponent extends Component {
 *    @tracked
 *    remainingApples = 10
 * }
 * ```
 *
 * When something changes the component's `remainingApples` property, the rerender
 * will be scheduled.
 *
 * @example Computed Properties
 *
 * In the case that you have a getter that depends on other properties, tracked
 * properties accessed within the getter will automatically be tracked for you.
 * That means when any of those dependent tracked properties is changed, a
 * rerender of the component will be scheduled.
 *
 * In the following example we have two properties,
 * `eatenApples`, and `remainingApples`.
 *
 *
 * ```typescript
 * import Component from '@glimmer/component';
 * import { tracked } from '@glimmer/tracking';
 *
 * const totalApples = 100;
 *
 * export default class MyComponent extends Component {
 *    @tracked
 *    eatenApples = 0
 *
 *    get remainingApples() {
 *      return totalApples - this.eatenApples;
 *    }
 *
 *    increment() {
 *      this.eatenApples = this.eatenApples + 1;
 *    }
 *  }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tracked: PropertyDecorator = (...args: any[]) => {
  const [target, key, descriptor] = args;

  // Error on `@tracked()`, `@tracked(...args)`, and `@tracked get propName()`
  if (DEBUG && typeof target === 'string') throwTrackedWithArgumentsError(args);
  if (DEBUG && target === undefined) throwTrackedWithEmptyArgumentsError();
  if (DEBUG && descriptor && descriptor.get) throwTrackedComputedPropertyError();

  if (descriptor) {
    return descriptorForField(target, key, descriptor);
  }
  // In TypeScript's implementation, decorators on simple class fields do not
  // receive a descriptor, so we define the property on the target directly.
  Object.defineProperty(target, key, descriptorForField(target, key));
};

function throwTrackedComputedPropertyError(): never {
  throw new Error(
    `The @tracked decorator does not need to be applied to getters. Properties implemented using a getter will recompute automatically when any tracked properties they access change.`
  );
}

function throwTrackedWithArgumentsError(args: unknown[]): never {
  throw new Error(
    `You attempted to use @tracked with ${
      args.length > 1 ? 'arguments' : 'an argument'
    } ( @tracked(${args
      .map((d) => `'${d}'`)
      .join(
        ', '
      )}) ), which is no longer necessary nor supported. Dependencies are now automatically tracked, so you can just use ${'`@tracked`'}.`
  );
}

function throwTrackedWithEmptyArgumentsError(): never {
  throw new Error(
    'You attempted to use @tracked(), which is no longer necessary nor supported. Remove the parentheses and you will be good to go!'
  );
}

/**
 * Whenever a tracked computed property is entered, the current tracker is
 * saved off and a new tracker is replaced.
 *
 * Any tracked properties consumed are added to the current tracker.
 *
 * When a tracked computed property is exited, the tracker's tags are
 * combined and added to the parent tracker.
 *
 * The consequence is that each tracked computed property has a tag
 * that corresponds to the tracked properties consumed inside of
 * itself, including child tracked computed properties.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DecoratorPropertyDescriptor = (PropertyDescriptor & { initializer?: any }) | undefined;

function descriptorForField<T extends object, K extends keyof T>(
  _target: T,
  key: K,
  desc?: DecoratorPropertyDescriptor
): PropertyDescriptor {
  if (DEBUG && desc && (desc.value || desc.get || desc.set)) {
    throw new Error(
      `You attempted to use @tracked on ${String(
        key
      )}, but that element is not a class field. @tracked is only usable on class fields. Native getters and setters will autotrack add any tracked fields they encounter, so there is no need mark getters and setters with @tracked.`
    );
  }

  const { getter, setter } = trackedData<T, K>(key, desc && desc.initializer);

  return {
    enumerable: true,
    configurable: true,

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(this: T): any {
      return getter(this);
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set(this: T, newValue: any): void {
      setter(this, newValue);
    },
  };
}
