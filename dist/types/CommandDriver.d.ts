export declare class CommandDriver {
    name: string;
    toTranslator: (message: string) => string;
    fromTranslator: (message: string) => string;
    constructor(name: string, toTranslator: (message: string) => string, fromTranslator: (message: string) => string);
}
export declare function toReplaceCommands(message: string, pattern: (index: number) => string): string;
export declare class DropCommandDriver extends CommandDriver {
    constructor();
}
export declare const commandDrivers: CommandDriver[];
