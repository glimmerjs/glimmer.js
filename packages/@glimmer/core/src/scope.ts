import { Dict } from '@glimmer/interfaces';

const COMPONENT_INSTANCE_SCOPE_MAP = new WeakMap<{}, Dict<unknown>>();

export const PUBLIC_DYNAMIC_SCOPE_KEY = `__PUBLIC_DYNAMIC_SCOPE_${Math.floor(Math.random() * Date.now())}__`;

export function getScope(component: object) {
  return COMPONENT_INSTANCE_SCOPE_MAP.get(component);
}

export function setScope(component: object, scope: Dict<unknown>) {
  COMPONENT_INSTANCE_SCOPE_MAP.set(component, scope);
}
