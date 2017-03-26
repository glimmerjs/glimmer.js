import { ConstReference } from "@glimmer/reference";
import { VM, Arguments } from "@glimmer/runtime";

export default function buildAction(vm: VM, _args: Arguments) {
  let componentRef = vm.getSelf();
  let args = _args.capture();

  return new ConstReference(function action(...invokedArgs) {
    let curriedArgs = args.positional.value();
    let actionFunc = curriedArgs.shift() as Function;

    curriedArgs.push(...invokedArgs);

    // Invoke the function with the component as the context, the curried
    // arguments passed to `{{action}}`, and the arguments the bound function
    // was invoked with.
    actionFunc.apply(componentRef.value(), curriedArgs);
  });
}
