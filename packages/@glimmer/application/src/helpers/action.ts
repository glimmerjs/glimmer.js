import { ConstReference, VersionedPathReference } from "@glimmer/reference";
import { VM, Arguments } from "@glimmer/runtime";

export default function buildAction(vm: VM, _args: Arguments) {
  let componentRef = vm.getSelf();
  let args = _args.capture();

  let actionFunc = args.positional.at(0).value() as Function;
  if (typeof actionFunc !== 'function') {
    let refSourceInfo = debugInfoForReference(args.positional.at(0));
    throw new Error(`You tried to create an action with the {{action}} helper, but the first argument ${refSourceInfo}was ${typeof actionFunc} instead of a function.`);
  }

  return new ConstReference(function action(...invokedArgs) {
    let curriedArgs = args.positional.value();
    // Consume the action function that was already captured above.
    curriedArgs.shift();

    curriedArgs.push(...invokedArgs);

    // Invoke the function with the component as the context, the curried
    // arguments passed to `{{action}}`, and the arguments the bound function
    // was invoked with.
    actionFunc.apply(componentRef && componentRef.value(), curriedArgs);
  });
}

function debugInfoForReference(reference: any): string {
  let message = '';

  if (reference['parent'] && reference['property']) {
    message += `(${reference['property']} on `;
    let parentRef = reference['parent'] as VersionedPathReference<any>;
    let parent = parentRef.value();
    message += debugName(parent) + ') ';
  }

  return message;
}

function debugName(obj: any) {
  let objType = typeof obj;
  if (obj == null) {
    return objType;
  } else if (objType === 'number' || objType === 'boolean') {
    return obj.toString();
  } else {
    if (obj['debugName']) {
      return obj['debugName'];
    }
    try {
      return JSON.stringify(obj);
    } catch (e) { }
    return obj.toString();
  }
}
