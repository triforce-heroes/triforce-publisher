interface CompileOptions {
    translate?: string;
}
export declare function PrepareCommand(engineDriver: string, sourceDriver: string, filesMatcher: string, options?: CompileOptions): Promise<void>;
export {};
