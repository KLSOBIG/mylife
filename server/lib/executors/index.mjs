import { runCliExecutor } from "./cli-executor.mjs";
import { runOpencodeExecutor } from "./opencode-executor.mjs";

export function runExecutor(executor, task) {
  if (executor.kind === "opencode") {
    return runOpencodeExecutor(executor, task);
  }

  return runCliExecutor(executor, task);
}
