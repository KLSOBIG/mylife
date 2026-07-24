import { runCliExecutor } from "./cli-executor.mjs";

export function runOpencodeExecutor(executor, task) {
  const command = executor.command || "opencode";
  const args = executor.args?.length
    ? executor.args
    : [
        "run",
        "--json",
        JSON.stringify({
          title: task.title || "",
          summary: task.summary || "",
          prompt: task.prompt || task.title || ""
        })
      ];

  return runCliExecutor(
    {
      ...executor,
      command,
      args
    },
    task
  );
}
