import { DEBUG } from '@glimmer/env';
import {
  InternalModifierManager,
  VMArguments,
  CapturedArguments,
  Destroyable,
  DynamicScope,
  ModifierManager,
  ModifierCapabilitiesVersions,
  ModifierCapabilities,
} from '@glimmer/interfaces';
import { UpdatableTag, createUpdatableTag, untrack } from '@glimmer/validator';
import { assert } from '@glimmer/util';
import { SimpleElement } from '@simple-dom/interface';
import { TemplateArgs } from '../interfaces';
import { argsProxyFor } from './util';
import { OWNER_KEY } from '../owner';
import { VMModifierDefinitionWithHandle } from '../render-component/vm-definitions';
import { registerDestructor, getModifierManager, buildCapabilities } from '@glimmer/runtime';
import { valueForRef } from '@glimmer/reference';

///////////

export function capabilities<Version extends keyof ModifierCapabilitiesVersions>(
  managerAPI: Version,
  optionalFeatures: ModifierCapabilitiesVersions[Version] = {}
): ModifierCapabilities {
  assert(
    managerAPI === '3.13' || managerAPI === '3.22',
    'Invalid modifier manager compatibility specified'
  );

  return buildCapabilities({
    disableAutoTracking: Boolean(optionalFeatures.disableAutoTracking),
    useArgsProxy: managerAPI === '3.13' ? false : true,
    passFactoryToCreate: managerAPI === '3.13',
  });
}

///////////

export type ModifierDefinition<_Instance = unknown> = {};

export type SimpleModifier = (element: Element, ...args: unknown[]) => undefined | (() => void);

interface SimpleModifierStateBucket {
  definition: SimpleModifier;
  destructor?(): void;
  element?: SimpleElement;
}

class SimpleModifierManager implements ModifierManager<SimpleModifierStateBucket> {
  capabilities = capabilities('3.13');

  createModifier(definition: SimpleModifier, args: TemplateArgs): SimpleModifierStateBucket {
    if (DEBUG) {
      assert(
        Object.keys(args.named).length === 0,
        `You used named arguments with the ${definition.name} modifier, but it is a standard function. Normal functions cannot receive named arguments when used as modifiers.`
      );
    }

    return { definition };
  }

  installModifier(
    bucket: SimpleModifierStateBucket,
    element: SimpleElement,
    args: TemplateArgs
  ): void {
    bucket.destructor = bucket.definition((element as unknown) as Element, ...args.positional);
    bucket.element = element;
  }

  updateModifier(bucket: SimpleModifierStateBucket, args: TemplateArgs): void {
    this.destroyModifier(bucket);
    this.installModifier(bucket, bucket.element!, args);
  }

  destroyModifier(bucket: SimpleModifierStateBucket): void {
    const { destructor } = bucket;

    if (destructor !== undefined) {
      destructor();
    }
  }
}

const SIMPLE_MODIFIER_MANAGER = new SimpleModifierManager();

///////////

export class CustomModifierState<ModifierStateBucket> {
  public tag = createUpdatableTag();

  constructor(
    public element: SimpleElement,
    public delegate: ModifierManager<ModifierStateBucket>,
    public modifier: ModifierStateBucket,
    public argsProxy: TemplateArgs,
    public capturedArgs: CapturedArguments
  ) {
    registerDestructor(this, () => delegate.destroyModifier(modifier, argsProxy));
  }
}

export class CustomModifierManager<ModifierStateBucket>
  implements
    InternalModifierManager<
      CustomModifierState<ModifierStateBucket>,
      ModifierDefinition<ModifierStateBucket>
    > {
  create(
    element: SimpleElement,
    definition: ModifierDefinition<ModifierStateBucket>,
    args: VMArguments,
    dynamicScope: DynamicScope
  ): CustomModifierState<ModifierStateBucket> {
    const owner = valueForRef(dynamicScope.get(OWNER_KEY)) as object;
    let delegate = getModifierManager(owner, definition) as ModifierManager<ModifierStateBucket>;

    if (delegate === undefined) {
      if (DEBUG) {
        assert(
          typeof definition === 'function',
          `No modifier manager found for ${definition}, and it was not a plain function, so it could not be used as a modifier`
        );
      }

      delegate = (SIMPLE_MODIFIER_MANAGER as unknown) as ModifierManager<ModifierStateBucket>;
    }

    const capturedArgs = args.capture();
    const argsProxy = argsProxyFor(capturedArgs, 'modifier');

    const instance = delegate.createModifier(definition, argsProxy);

    return new CustomModifierState(element, delegate, instance, argsProxy, capturedArgs);
  }

  getDebugName(state: CustomModifierState<ModifierStateBucket>): string {
    // TODO: This should be updated to call `delegate.getDebugName` or something along those lines
    return String(state.modifier);
  }

  getTag({ tag }: CustomModifierState<ModifierStateBucket>): UpdatableTag {
    return tag;
  }

  install(state: CustomModifierState<ModifierStateBucket>): void {
    const { element, argsProxy, delegate, modifier } = state;

    if (delegate.capabilities.disableAutoTracking === true) {
      untrack(() => delegate.installModifier(modifier, element, argsProxy));
    } else {
      delegate.installModifier(modifier, element, argsProxy);
    }
  }

  update(state: CustomModifierState<ModifierStateBucket>): void {
    const { argsProxy, delegate, modifier } = state;

    if (delegate.capabilities.disableAutoTracking === true) {
      untrack(() => delegate.updateModifier(modifier, argsProxy));
    } else {
      delegate.updateModifier(modifier, argsProxy);
    }
  }

  getDestroyable(state: CustomModifierState<ModifierStateBucket>): Destroyable {
    return state;
  }
}

export const CUSTOM_MODIFIER_MANAGER = new CustomModifierManager();

export class VMCustomModifierDefinition<ModifierStateBucket>
  implements VMModifierDefinitionWithHandle {
  public manager = CUSTOM_MODIFIER_MANAGER;

  constructor(public handle: number, public state: ModifierDefinition<ModifierStateBucket>) {}
}
