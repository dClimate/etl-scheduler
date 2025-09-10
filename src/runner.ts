/**
 * Core runner: runs scripts on demand with the old CID, interprets stdout
 * as the new CID (or "-1" for no-change), pushes CID to a container, and
 * persists it.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ScriptTask, RunResult } from "./types";
import { getLatestCIDForDataset, storeLatestCIDForDataset } from "./ceramic-adapter";

const execFileAsync = promisify(execFile);
const datasetLocks = new Map<string, Promise<void>>();

/** Basic CID heuristic (accepts typical CIDv1 base32 like "bafy..."). */
function looksLikeCid(s: string): boolean {
    return /^[a-z0-9]{32,}$/.test(s);
}

/** Run a single task once (with per-dataset lock). */
export async function runTask(task: ScriptTask): Promise<RunResult> {
    if (datasetLocks.has(task.dataset)) {
        console.warn(`[lock] Skip ${task.dataset}: previous run in progress`);
        return { kind: "skipped" };
    }

    const lock = (async (): Promise<RunResult> => {
        const start = Date.now();
        try {
            const oldCid = await getLatestCIDForDataset(task.dataset);
            const { stdout } = await execFileAsync(task.command, [oldCid], { windowsHide: true });
            const out = stdout.trim();

            if (out === "-1") {
                console.log(`[no-change] ${task.dataset} (old=${oldCid})`);
                return { kind: "no-change", stdout };
            }

            if (!looksLikeCid(out)) {
                console.warn(`[warn] Output might not be a CID for ${task.dataset}: "${out}"`);
                return { kind: "failed", error: Error("Output is not a CID") };
            }

            await storeLatestCIDForDataset(task.dataset, out);
            console.log(`[updated] ${task.dataset} ${oldCid} -> ${out} (${Date.now() - start}ms)`);
            return { kind: "updated", newCid: out, stdout };
        } catch (error: any) {
            console.error(`[error] ${task.dataset}:`, error?.message ?? String(error));
            return { kind: "failed", error };
        } finally {
            datasetLocks.delete(task.dataset);
        }
    })();

    datasetLocks.set(
        task.dataset,
        lock.then(() => undefined)
    );
    return lock;
}
