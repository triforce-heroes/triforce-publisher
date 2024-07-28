export function isSame(
  a?: Record<string, unknown>,
  b?: Record<string, unknown>,
) {
  if (a === undefined || b === undefined) {
    return false;
  }

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) => a[key] === b[key]);
}
