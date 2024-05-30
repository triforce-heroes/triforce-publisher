interface CompileOptions {
    letters?: boolean;
    uniques?: boolean;
    translate?: string;
    cookieId?: string;
    concurrences: number;
}
export declare function CompileCommand(engineDriver: string, languagesInput: string, options?: CompileOptions): Promise<void>;
export {};
