import { createClient } from "@libsql/client";
// eslint-disable-next-line import/no-unassigned-import
import "dotenv/config";

import type { Client, InArgs } from "@libsql/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Interface = Record<string, any>;

let dbInstance: Client | undefined = undefined;

function db() {
  dbInstance ??= createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return dbInstance;
}

export type Row<T extends Interface> = {
  [K in keyof T]: T[K] extends infer N
    ? N extends object | []
      ? string
      : N
    : never;
};

export async function execute<T extends Interface>(
  sql: string,
  args: InArgs = {},
) {
  return db()
    .execute({ sql, args })
    .then(({ rows }) => rows as unknown as Array<Row<T>>);
}

export async function executeFirst<T extends Interface>(
  sql: string,
  args: InArgs = {},
) {
  return execute<T>(sql, args).then(([row]) => row ?? null);
}

export async function batch(queries: Array<[query: string, args: InArgs]>) {
  return db().batch(
    queries.map(([sql, args]) => ({ sql, args })),
    "write",
  );
}
