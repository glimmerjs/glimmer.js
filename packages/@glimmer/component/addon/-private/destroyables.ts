const DESTROYING = new WeakMap<object, boolean>();
const DESTROYED = new WeakMap<object, boolean>();

// TODO: remove once glimmer.js is updated to glimmer-vm 0.54.0+ and can use the destroyables API directly
export function setDestroying(component: object) {
  DESTROYING.set(component, true);
}
export function setDestroyed(component: object) {
  DESTROYED.set(component, true);
}

export function isDestroying(component: object) {
  return DESTROYING.has(component);
}

export function isDestroyed(component: object) {
  return DESTROYED.has(component);
}
