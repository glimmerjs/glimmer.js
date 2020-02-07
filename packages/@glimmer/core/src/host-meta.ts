const COMPONENT_INSTANCE_HOST_META_MAP = new WeakMap<{}, unknown>();

export const HOST_META_KEY = `__HOST_META_${Math.floor(Math.random() * Date.now())}__`;

export function getHostMeta(component: object) {
  return COMPONENT_INSTANCE_HOST_META_MAP.get(component);
}

export function setHostMeta(component: object, hostMeta: unknown) {
  COMPONENT_INSTANCE_HOST_META_MAP.set(component, hostMeta);
}
