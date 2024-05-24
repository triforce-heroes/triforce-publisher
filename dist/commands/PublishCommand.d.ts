interface PublishCommandOptions {
    dryRun?: boolean;
}
export declare function PublishCommand(engineName: string, options?: PublishCommandOptions): Promise<void>;
export {};
