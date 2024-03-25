interface CompileOptions {
    letters?: boolean;
    uniques?: boolean;
    translate?: string;
    translateRetry?: boolean;
}
export declare function CompileCommand(engineDriver: string, languagesInput: string, options?: CompileOptions): Promise<void>;
export {};
