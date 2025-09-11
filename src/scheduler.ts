/**
 * Cron scheduler: defines tasks and wires them to the runner.
 */
import cron from "node-cron";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { runTask } from "./runner";
import type { ScriptTask } from "./types";

async function loadTasks(): Promise<ScriptTask[]> {
    const filePath = path.join(process.cwd(), "tasks.json");
    if (!existsSync(filePath)) {
        throw new Error("Please create a tasks.json file (see tasks.example.json).");
    }

    try {
        const raw = await readFile(filePath, "utf8");
        const parsed: ScriptTask[] = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            throw new Error("Task configuration must be an array");
        }

        return parsed.map((t, index) => {
            if (typeof t.dataset !== "string" || typeof t.command !== "string" || typeof t.cron !== "string") {
                throw new Error(`Invalid task at index ${index}`);
            }

            return t;
        });
    } catch (error) {
        throw new Error("Cannot load tasks file at ${filePath}." + (error as Error).message);
    }
}

/** Bootstraps the scheduler: defines tasks and wires them to the runner. */
const bootstrap = async (): Promise<void> => {
    const tasks = await loadTasks();
    console.log(`[loaded] ${tasks.length} tasks`);
    tasks.forEach(t => console.log(t));

    tasks.forEach((t) => runTask(t));

    for (const t of tasks) {
        if (!cron.validate(t.cron)) {
            throw new Error(`Invalid cron for ${t.dataset}: "${t.cron}"`);
        }
        cron.schedule(t.cron, async () => {
            await runTask(t);
        });
        console.log(`[scheduled] ${t.dataset} :: ${t.cron} :: ${t.command}`);
    }

    process.on("SIGINT", () => {
        console.log("SIGINT received, exiting.");
        process.exit(0);
    });
    process.on("SIGTERM", () => {
        console.log("SIGTERM received, exiting.");
        process.exit(0);
    });
};

bootstrap().catch((e) => {
    console.error(e);
    process.exit(1);
});
