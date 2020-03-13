export default function toBool(predicate: unknown): boolean {
  if (Array.isArray(predicate)) {
    return predicate.length !== 0;
  } else {
    return Boolean(predicate);
  }
}
