import {
  SymbolTable
} from '@glimmer/interfaces';
import {
  RevisionTag,
  PathReference,
  TagWrapper
} from '@glimmer/reference';
import {
  ComponentDefinition,
  Environment as GlimmerEnvironment,
  VM,
  Arguments,
  ComponentArgs,
  UNDEFINED_REFERENCE
} from '@glimmer/runtime';
import {
  Opaque,
  Option
} from '@glimmer/util';
import * as WireFormat from '@glimmer/wire-format';
import { TemplateMeta } from "./index";

export function blockComponentMacro(params, hash, template, inverse, builder) {
  let definitionArgs: ComponentArgs = [params.slice(0, 1), null, null, null];
  let args: ComponentArgs = [params.slice(1), hashToArgs(hash), template, inverse];

  builder.component.dynamic(definitionArgs, dynamicComponentFor, args);

  return true;
}

export function inlineComponentMacro(_name, params, hash, builder) {
  let definitionArgs: ComponentArgs = [params!.slice(0, 1), null, null, null];
  let args: ComponentArgs = [params!.slice(1), hashToArgs(hash), null, null];

  builder.component.dynamic(definitionArgs, dynamicComponentFor, args);

  return true;
}

function dynamicComponentFor(vm: VM, args: Arguments, meta: TemplateMeta): DynamicComponentReference {
  let nameRef = args.positional.at(0);
  let env = vm.env;

  return new DynamicComponentReference(nameRef, env, meta);
}

class DynamicComponentReference implements PathReference<ComponentDefinition<Opaque>> {
  public tag: TagWrapper<RevisionTag>;

  constructor(private nameRef: PathReference<Opaque>, private env: GlimmerEnvironment, private meta: TemplateMeta) {
    this.tag = nameRef.tag;
  }

  value(): ComponentDefinition<Opaque> {
    let { env, nameRef } = this;

    let nameOrDef = nameRef.value();

    if (typeof nameOrDef === 'string') {
      debugger;
      return env.getComponentDefinition(nameOrDef, this.meta);
    }

    return null;
  }

  get() {
    return UNDEFINED_REFERENCE;
  }
}

function hashToArgs(hash: Option<WireFormat.Core.Hash>): Option<WireFormat.Core.Hash> {
  if (hash === null) return null;
  let names = hash[0].map(key => `@${key}`);
  return [names, hash[1]];
}
