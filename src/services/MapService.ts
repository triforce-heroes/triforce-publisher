import type { MapObject } from "#/types/MapObject";

export function toObject(value: Map<string, Map<string, string>>): MapObject {
  return Object.fromEntries(
    [...value].map(([resource, refs]) => [resource, Object.fromEntries(refs)]),
  );
}
