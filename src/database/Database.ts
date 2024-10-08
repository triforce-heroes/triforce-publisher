import { Client, createClient, InArgs } from "@libsql/client";
// eslint-disable-next-line import/no-unassigned-import
import "dotenv/config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Interface = Record<string, any>;

export type Row<T extends Interface> = {
  [K in keyof T]: T[K] extends infer N
    ? N extends object | []
      ? string
      : N
    : never;
};

let dbInstance: Client | undefined;

function db() {
  if (!dbInstance) {
    dbInstance = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  return dbInstance;
}

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
