const BINDINGS_MAP = new WeakMap();

export function action(target: any, key: any): any;
export function action(target: any, key: any, descriptor: PropertyDescriptor): PropertyDescriptor;
export function action(...args: any[]): any {
  let [, , desc] = args;

  const actionFn = desc.value;

  return {
    enumerable: desc.enumerable,
    configurable: desc.configurable,
    get() {
      let bindings = BINDINGS_MAP.get(this);
      if (bindings === undefined) {
        bindings = new Map();
        BINDINGS_MAP.set(this, bindings);
      }

      let fn = bindings.get(actionFn);
      if (fn === undefined) {
        fn = actionFn.bind(this);
        bindings.set(actionFn, fn);
      }

      return fn;
    },
  };
}
