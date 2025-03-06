import "dotenv/config";
import type { InArgs } from "@libsql/client";
type Interface = Record<string, any>;
export type Row<T extends Interface> = {
    [K in keyof T]: T[K] extends infer N ? N extends object | [] ? string : N : never;
};
export declare function execute<T extends Interface>(sql: string, args?: InArgs): Promise<Row<T>[]>;
export declare function executeFirst<T extends Interface>(sql: string, args?: InArgs): Promise<Row<T> | null>;
export declare function batch(queries: Array<[query: string, args: InArgs]>): Promise<import("@libsql/client").ResultSet[]>;
export {};
