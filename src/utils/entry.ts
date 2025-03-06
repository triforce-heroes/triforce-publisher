import type { DataEntry } from "../types/DataEntry.js";

export function getEntryKey(
  entry: Pick<DataEntry, "context" | "reference" | "resource">,
) {
  return `${entry.resource}:${entry.context ?? ""}:${entry.reference}`;
}
