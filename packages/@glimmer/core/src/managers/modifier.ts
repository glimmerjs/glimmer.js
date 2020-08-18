import { DEBUG } from '@glimmer/env';
import {
  ModifierManager as VMModifierManager,
  VMArguments,
  CapturedArguments,
  Destroyable,
  DynamicScope,
} from '@glimmer/interfaces';
import { Tag, createUpdatableTag, track, untrack, combine, updateTag } from '@glimmer/validator';
import { assert, debugToString } from '@glimmer/util';
import { SimpleElement } from '@simple-dom/interface';
import { TemplateArgs } from '../interfaces';
import debugRenderMessage from '../utils/debug';
import { argsProxyFor } from './util';
import { getModifierManager } from '.';
import { OWNER_KEY } from '../owner';
import { VMModifierDefinitionWithHandle } from '../render-component/vm-definitions';
import { registerDestructor } from '@glimmer/runtime';

///////////

export interface Capabilities {
  disableAutoTracking: boolean;
}

export type OptionalCapabilities = Partial<Capabilities>;

export type ManagerAPIVersion = '3.13';

export function capabilities(
  managerAPI: ManagerAPIVersion,
  options: OptionalCapabilities = {}
): Capabilities {
  assert(managerAPI === '3.13', 'Invalid component manager compatibility specified');

  return {
    disableAutoTracking: Boolean(options.disableAutoTracking),
  };
}

///////////

export interface ModifierManager<ModifierStateBucket> {
  capabilities: Capabilities;
  createModifier(definition: unknown, args: TemplateArgs): ModifierStateBucket;
  installModifier(instance: ModifierStateBucket, element: Element, args: TemplateArgs): void;
  updateModifier(instance: ModifierStateBucket, args: TemplateArgs): void;
  destroyModifier(instance: ModifierStateBucket, args: TemplateArgs): void;
}

export type ModifierDefinition<_Instance = unknown> = {};

export type SimpleModifier = (element: Element, ...args: unknown[]) => undefined | (() => void);

interface SimpleModifierStateBucket {
  definition: SimpleModifier;
  destructor?(): void;
  element?: Element;
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

  installModifier(bucket: SimpleModifierStateBucket, element: Element, args: TemplateArgs): void {
    bucket.destructor = bucket.definition(element, ...args.positional);
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
    VMModifierManager<
      CustomModifierState<ModifierStateBucket>,
      ModifierDefinition<ModifierStateBucket>
    > {
  create(
    element: SimpleElement,
    definition: ModifierDefinition<ModifierStateBucket>,
    args: VMArguments,
    dynamicScope: DynamicScope
  ): CustomModifierState<ModifierStateBucket> {
    const owner = dynamicScope.get(OWNER_KEY).value() as object;
    let delegate = getModifierManager(owner, definition);

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

  getTag({ tag, capturedArgs }: CustomModifierState<ModifierStateBucket>): Tag {
    return combine([tag, capturedArgs.tag]);
  }

  install(state: CustomModifierState<ModifierStateBucket>): void {
    const { element, argsProxy, delegate, modifier, tag } = state;

    if (delegate.capabilities.disableAutoTracking === true) {
      untrack(() => delegate.installModifier(modifier, element as Element, argsProxy));
    } else {
      const combinedTrackingTag = track(
        () => delegate.installModifier(modifier, element as Element, argsProxy),
        DEBUG && debugRenderMessage!(`(instance of a \`${debugToString!(modifier)}\` modifier)`)
      );

      updateTag(tag, combinedTrackingTag);
    }
  }

  update(state: CustomModifierState<ModifierStateBucket>): void {
    const { argsProxy, delegate, modifier, tag } = state;

    if (delegate.capabilities.disableAutoTracking === true) {
      untrack(() => delegate.updateModifier(modifier, argsProxy));
    } else {
      const combinedTrackingTag = track(
        () => delegate.updateModifier(modifier, argsProxy),
        DEBUG && debugRenderMessage!(`(instance of a \`${debugToString!(modifier)}\` modifier)`)
      );
      updateTag(tag, combinedTrackingTag);
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
