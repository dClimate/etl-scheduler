/**
 * Cron scheduler: defines tasks and wires them to the runner.
 */
import cron from "node-cron";
import { runTask } from "./runner.js";
import type { ScriptTask } from "./types.js";

// Define your tasks here
const tasks: ScriptTask[] = [
  {
    dataset: "fpar",
    command: "cd ../../etl-script && uv run veg-index/fpar.py append",
    cron: "0 0 * * *" // Every day at midnight
  },
];

/ Bootstraps the scheduler: defines tasks and wires them to the runner. */
const bootstrap = async () => {
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
}

bootstrap().catch((e) => {
  console.error(e);
  process.exit(1);
});
