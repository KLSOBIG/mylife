import { describe, expect, it } from "vitest";
import { createExecutionLog, createExecutionRun } from "./execution-runtime";
import { createInitialModel, createInitialState, reduceModel, reduceState } from "./store";

describe("reduceState", () => {
  it("switches workspace and clears selected detail", () => {
    const state = {
      ...createInitialState(),
      selectedEventId: "ev_1",
      selectedTaskId: "task_1"
    };

    const next = reduceState(state, { type: "workspace/switched", workspaceId: "ws_team" });

    expect(next.currentWorkspaceId).toBe("ws_team");
    expect(next.selectedEventId).toBeUndefined();
    expect(next.selectedTaskId).toBeUndefined();
  });
});

describe("reduceModel", () => {
  it("updates task status in model data", () => {
    const model = createInitialModel();

    const next = reduceModel(model, {
      type: "task/statusChanged",
      taskId: "task_1",
      status: "completed"
    });

    expect(next.data.tasks.find((item) => item.id === "task_1")?.status).toBe("completed");
    expect(model.data.tasks.find((item) => item.id === "task_1")?.status).toBe("in_progress");
  });

  it("creates workspace and switches to it", () => {
    const model = createInitialModel();

    const next = reduceModel(model, {
      type: "workspace/created",
      workspace: {
        id: "ws_new",
        name: "新空间",
        kind: "life",
        description: "测试工作空间",
        icon: "✦"
      }
    });

    expect(next.data.workspaces.some((item) => item.id === "ws_new")).toBe(true);
    expect(next.state.currentWorkspaceId).toBe("ws_new");
  });

  it("toggles rule state", () => {
    const model = createInitialModel();

    const next = reduceModel(model, {
      type: "rule/toggled",
      ruleId: "rule_1"
    });

    expect(next.data.rules.find((item) => item.id === "rule_1")?.enabled).toBe(false);
  });

  it("starts execution run in model data", () => {
    const model = createInitialModel();
    const run = createExecutionRun({
      id: "run_1",
      workspaceId: "ws_personal",
      taskId: "task_1",
      executorId: "exec_kael",
      trigger: "manual",
      startedAt: "2026-07-23 09:00"
    });

    const next = reduceModel(model, {
      type: "task/executionStarted",
      run
    });

    expect(next.data.executionRuns).toHaveLength(model.data.executionRuns.length + 1);
    expect(next.data.executionRuns[0]).toMatchObject({
      id: "run_1",
      taskId: "task_1",
      status: "queued"
    });
  });

  it("records execution logs and completion", () => {
    const model = createInitialModel();
    const run = createExecutionRun({
      id: "run_2",
      workspaceId: "ws_team",
      taskId: "task_4",
      executorId: "exec_harness",
      trigger: "auto",
      startedAt: "2026-07-23 10:00"
    });
    const started = reduceModel(model, { type: "task/executionStarted", run });
    const running = reduceModel(started, {
      type: "task/executionRunning",
      taskId: "task_4",
      runId: "run_2",
      log: createExecutionLog({
        id: "log_1",
        at: "2026-07-23 10:01",
        level: "info",
        message: "执行中"
      })
    });
    const finished = reduceModel(running, {
      type: "task/executionSucceeded",
      taskId: "task_4",
      runId: "run_2",
      finishedAt: "2026-07-23 10:05",
      summary: "完成"
    });

    expect(finished.data.executionRuns[0]).toMatchObject({
      id: "run_2",
      status: "succeeded",
      finishedAt: "2026-07-23 10:05",
      summary: "完成"
    });
    expect(finished.data.executionRuns[0]?.logs).toHaveLength(1);
  });
});
