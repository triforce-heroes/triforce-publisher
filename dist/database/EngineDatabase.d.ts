interface Engine {
    id: number;
    engine: string;
}
export declare function getEngine(engine: string): Promise<import("./Database.js").Row<Engine> | null>;
export {};
