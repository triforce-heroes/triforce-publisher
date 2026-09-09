export function normalizeMetadata(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("metadata must be an object");
  }

  if (Object.keys(value).length === 0) {
    return undefined;
  }

  return value as Record<string, unknown>;
}
