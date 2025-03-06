export function isSame(
  objectA?: Record<string, unknown>,
  objectB?: Record<string, unknown>,
) {
  if (objectA === undefined || objectB === undefined) {
    return false;
  }

  const aKeys = Object.keys(objectA);
  const bKeys = Object.keys(objectB);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) => objectA[key] === objectB[key]);
}
