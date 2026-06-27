export function parseAs<T>(value: string, defaultValue: T): T;

export function parseAs<T>(value: string, defaultValue?: T): T | undefined;

export function parseAs<T>(value: string, defaultValue: T | undefined): T | undefined {
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}
