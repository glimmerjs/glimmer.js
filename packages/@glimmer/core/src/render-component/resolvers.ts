import {
  ResolvedValue,
  ComponentDefinition as VMComponentDefinition,
  RuntimeResolverDelegate,
  Template,
  Option,
  CompileTimeComponent,
  Helper as GlimmerHelper,
} from '@glimmer/interfaces';
import { ResolverDelegate, unwrapTemplate } from '@glimmer/opcode-compiler';

import {
  vmDefinitionForComponent,
  vmDefinitionForHelper,
  Modifier,
  vmHandleForModifier,
} from './vm-definitions';

import { ComponentDefinition } from '../managers/component/custom';
import { TemplateMeta } from '../template';

///////////

/**
 * The RuntimeResolver is what is used to resolve everything. It is responsible
 * for registering root components (passed to `renderComponent`), and resolving
 * all other types of resolvables.
 *
 * The CompileTimeResolver is responsible for registering everything but root
 * components, which is why `registry` is public, for ease of access.
 */
export class RuntimeResolver implements RuntimeResolverDelegate {
  registry: unknown[] = [];

  // TODO: This is only necessary because `renderJitComponent` only receives a
  // string, can't receive a handle. We should make that optional somehow.
  registerRoot(definition: ComponentDefinition): string {
    const vmDefinition = vmDefinitionForComponent(definition);
    const { handle } = vmDefinition;

    this.registry[handle] = vmDefinition;

    // We're lying to the type system here so we can pass handle around as a
    // string. Should definitely fix this in the future.
    return (handle as unknown) as string;
  }

  lookupComponent(handle: string, _referrer?: unknown): Option<VMComponentDefinition> {
    return this.registry[(handle as unknown) as number] as Option<VMComponentDefinition>;
  }

  resolve<U extends ResolvedValue>(handle: number): U {
    return this.registry[handle] as U;
  }

  // TODO: Make these optional
  compilable(_locator: unknown): Template<unknown> {
    throw new Error('Method not implemented.');
  }

  lookupPartial(_name: string, _referrer?: unknown): Option<number> {
    throw new Error('Method not implemented.');
  }
}

///////////

/**
 * The CompileTimeResolver is what is used to lookup most things, with the
 * exception of root components rendered with `renderComponent`. It registers
 * the values on the RuntimeResolver, which Glimmer then uses to actually
 * resolve later on via the handle that is returned.
 */
export class CompileTimeResolver implements ResolverDelegate {
  constructor(private inner: RuntimeResolver) {}

  lookupHelper(name: string, referrer: TemplateMeta): Option<number> {
    const scope = referrer.scope();
    const Helper = scope[name] as GlimmerHelper;

    const { state } = vmDefinitionForHelper(Helper);
    const { fn, handle } = state;

    this.inner.registry[handle] = fn;
    return handle;
  }

  lookupModifier(name: string, referrer: TemplateMeta): Option<number> {
    const scope = referrer.scope();
    const modifier = scope[name] as Modifier;

    if (modifier === undefined) {
      throw new Error(`Cannot find modifier ${name} in scope`);
    }

    const handle = vmHandleForModifier(modifier);
    this.inner.registry[handle] = modifier;
    return handle;
  }

  lookupComponent(name: string, referrer: TemplateMeta): Option<CompileTimeComponent> {
    const scope = referrer.scope();
    const ComponentDefinition = scope[name] as ComponentDefinition;

    if (ComponentDefinition === undefined) {
      throw new Error(`Cannot find component ${name} in scope`);
    }

    const definition = vmDefinitionForComponent(ComponentDefinition);
    const { state, manager, template, handle } = definition;

    this.inner.registry[handle] = definition;

    return {
      handle,
      capabilities: manager.getCapabilities(state),
      compilable: unwrapTemplate(template).asLayout(),
    };
  }

  resolve(handle: number): unknown {
    return this.inner.resolve(handle);
  }

  // TODO: Make this optional
  lookupPartial(_name: string, _referrer: unknown): Option<number> {
    throw new Error('Method not implemented.');
  }
}
