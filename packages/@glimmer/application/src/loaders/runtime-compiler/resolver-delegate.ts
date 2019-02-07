import ApplicationJitRuntimeResolver, { Specifier } from "./resolver";
import { ResolverDelegate } from "@glimmer/opcode-compiler";
import {
  Option,
  CompileTimeComponent,
  CompilableProgram
} from "@glimmer/interfaces";

export default class ResolverDelegateImpl
  implements ResolverDelegate<Specifier> {
  constructor(private resolver: ApplicationJitRuntimeResolver) {}

  lookupHelper(name: string, referrer: Specifier): Option<number> {
    return this.resolver.lookupHelper(name, referrer);
  }

  lookupModifier(name: string, referrer: Specifier): Option<number> {
    return this.resolver.lookupModifier(name, referrer);
  }

  lookupComponent(
    name: string,
    referrer: Specifier
  ): Option<CompileTimeComponent> {
    let definition = this.resolver.lookupComponentHandle(name, referrer);

    if (definition === null) {
      return null;
    }
  }

  lookupPartial(name: string, referrer: Specifier): Option<number> {
    throw new Error("Partials are not supported in Glimmer.js");
  }

  // `name` is a cache key.
  // TODO: The caller should cache
  compile(source: string, name: string, wrapped: boolean): CompilableProgram {
    throw new Error("Unimplemented");
  }

  // For debugging
  resolve(handle: number): Specifier {
    throw new Error("Unimplemented");
  }
}
