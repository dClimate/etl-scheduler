export interface ScriptTask {
    dataset: string; // used for CID lookups/updates
    command: string; // executable path, invoked as: <command> <oldCID>
    cron: string; // cron expression ("0 * * * *")
}

export type RunResult =
    | { kind: "no-change"; stdout: string }
    | { kind: "updated"; newCid: string; stdout: string }
    | { kind: "skipped" }
    | { kind: "failed"; error: Error };
