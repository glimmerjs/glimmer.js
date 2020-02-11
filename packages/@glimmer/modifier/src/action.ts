const BINDINGS_MAP = new WeakMap();

export function action(target: {}, key: string): PropertyDescriptor;
export function action(target: {}, key: string, desc: PropertyDescriptor): PropertyDescriptor;
export function action(_target: {}, _key: string, desc?: PropertyDescriptor): PropertyDescriptor {
  const actionFn = desc!.value;

  return {
    enumerable: desc!.enumerable,
    configurable: desc!.configurable,

    get(): Function {
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
