import { ConstReference, VersionedPathReference, Reference } from "@glimmer/reference";
import { VM, Arguments } from "@glimmer/runtime";

export default function buildAction(vm: VM, _args: Arguments) {
  let componentRef = vm.getSelf();
  let args = _args.capture();

  let actionFunc = args.positional.at(0).value() as Function;
  if (typeof actionFunc !== 'function') {
    throwNoActionError(actionFunc, args.positional.at(0));
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

function throwNoActionError(actionFunc: any, actionFuncReference: Reference<any>) {
  let referenceInfo = debugInfoForReference(actionFuncReference);
  throw new Error(`You tried to create an action with the {{action}} helper, but the first argument ${referenceInfo}was ${typeof actionFunc} instead of a function.`);
}

export function debugInfoForReference(reference: any): string {
  let message = '';
  let parent;
  let property;

  if (reference == null) { return message; }

  if ('parent' in reference && 'property' in reference) {
    parent = reference['parent'].value();
    property = reference['property'];
  } else if ('_parentValue' in reference && '_propertyKey' in reference) {
    parent = reference['_parentValue'];
    property = reference['_propertyKey'];
  }

  if (property !== undefined) {
    message += `('${property}' on ${debugName(parent)}) `;
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
