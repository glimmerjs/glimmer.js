export const TRACKED = Symbol('TRACKED')
export const CACHED = Symbol('CACHED')

export function isTracked(obj: Object, key: string) {
  const proto = Object.getPrototypeOf(obj);
  const desc = Object.getOwnPropertyDescriptor(obj, key) || proto && Object.getOwnPropertyDescriptor(proto, key)
  return desc.get && (desc.get as any)[TRACKED] || false;
}


export function isCached(obj: Object, key: string) {
  const proto = Object.getPrototypeOf(obj);
  const desc = Object.getOwnPropertyDescriptor(obj, key) || proto && Object.getOwnPropertyDescriptor(proto, key)
  return desc.get && (desc.get as any)[CACHED] || false;
}
