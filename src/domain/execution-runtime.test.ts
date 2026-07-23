import { describe, expect, it } from "vitest";
import { appendExecutionLog, completeExecutionRun, createExecutionLog, createExecutionRun } from "./execution-runtime";

describe("execution-runtime", () => {
  it("creates queued execution run", () => {
    const run = createExecutionRun({
      id: "run_1",
      workspaceId: "ws_personal",
      taskId: "task_1",
      executorId: "exec_kael",
      trigger: "manual",
      startedAt: "2026-07-23 09:00"
    });

    expect(run).toMatchObject({
      id: "run_1",
      workspaceId: "ws_personal",
      taskId: "task_1",
      executorId: "exec_kael",
      trigger: "manual",
      status: "queued",
      startedAt: "2026-07-23 09:00"
    });
    expect(run.logs).toHaveLength(0);
  });

  it("appends execution log", () => {
    const run = createExecutionRun({
      id: "run_2",
      workspaceId: "ws_team",
      taskId: "task_4",
      executorId: "exec_harness",
      trigger: "auto",
      startedAt: "2026-07-23 10:00"
    });

    const next = appendExecutionLog(
      run,
      createExecutionLog({
        id: "log_1",
        at: "2026-07-23 10:01",
        level: "info",
        message: "执行中"
      })
    );

    expect(next.logs).toHaveLength(1);
    expect(next.updatedAt).toBe("2026-07-23 10:01");
  });

  it("completes execution run as failed", () => {
    const run = createExecutionRun({
      id: "run_3",
      workspaceId: "ws_team",
      taskId: "task_4",
      executorId: "exec_harness",
      trigger: "auto",
      startedAt: "2026-07-23 10:00"
    });

    const next = completeExecutionRun(run, {
      status: "failed",
      finishedAt: "2026-07-23 10:05",
      error: "timeout"
    });

    expect(next.status).toBe("failed");
    expect(next.finishedAt).toBe("2026-07-23 10:05");
    expect(next.error).toBe("timeout");
  });
});
