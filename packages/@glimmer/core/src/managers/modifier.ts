import { assert } from '@glimmer/util';
import { Dict } from '@glimmer/interfaces';
import { SimpleElement } from '@simple-dom/interface';

///////////

export interface Capabilities {
  disableAutoTracking: boolean;
}

export type OptionalCapabilities = Partial<Capabilities>;

export type ManagerAPIVersion = '3.4' | '3.13';

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

export interface Args {
  named: Dict<unknown>;
  positional: unknown[];
}

export interface ModifierManager<ModifierInstance> {
  capabilities: Capabilities;
  createModifier(definition: unknown, args: Args): ModifierInstance;
  installModifier(instance: ModifierInstance, element: SimpleElement, args: Args): void;
  updateModifier(instance: ModifierInstance, args: Args): void;
  destroyModifier(instance: ModifierInstance, args: Args): void;
}
