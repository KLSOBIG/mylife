import { describe, expect, it } from "vitest";
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
});
