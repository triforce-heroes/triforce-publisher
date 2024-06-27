interface PublishCommandOptions {
    dryRun: boolean;
    testRun: boolean;
}
export declare function PublishCommand(engineName: string, options: PublishCommandOptions): Promise<void>;
export {};
