import { spawn } from "node:child_process";

function tryParseJson(raw) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function runCliExecutor(executor, task) {
  return new Promise((resolve, reject) => {
    const child = spawn(executor.command, executor.args || [], {
      env: {
        ...process.env,
        NEXUS_TASK_PAYLOAD: JSON.stringify(task)
      }
    });

    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`executor timeout after ${executor.timeoutMs}ms`));
    }, executor.timeoutMs || 5000);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new Error(stderr || `executor exited with ${code}`));
      }

      const parsed = tryParseJson(stdout.trim());
      return resolve({
        summary: parsed?.summary || stdout.trim() || `${executor.name} 执行完成`,
        log: parsed?.log || stdout.trim() || `${executor.name} 执行完成`,
        raw: stdout.trim()
      });
    });
  });
}
