import { describe, expect, it } from "vitest";
import { loadAppModel, saveAppModel } from "./persistence";
import { createInitialModel } from "./store";

describe("persistence", () => {
  it("loads default model when storage is empty", () => {
    const storage = createStorage();
    const model = loadAppModel(storage);

    expect(model.data.tasks.length).toBeGreaterThan(0);
    expect(model.data.executionRuns.length).toBeGreaterThan(0);
    expect(model.state.currentWorkspaceId).toBe("ws_personal");
  });

  it("persists changed task status", () => {
    const model = createInitialModel();
    model.data.tasks[0]!.status = "completed";
    const storage = createStorage();

    saveAppModel(model, storage);

    expect(loadAppModel(storage).data.tasks[0]!.status).toBe("completed");
  });

  it("persists execution runs", () => {
    const model = createInitialModel();
    model.data.executionRuns.push({
      id: "run_2",
      taskId: "task_1",
      workspaceId: "ws_personal",
      executorId: "exec_kael",
      status: "running",
      trigger: "manual",
      startedAt: "2026-07-23 09:00",
      updatedAt: "2026-07-23 09:00",
      logs: []
    });
    const storage = createStorage();

    saveAppModel(model, storage);

    expect(loadAppModel(storage).data.executionRuns).toHaveLength(model.data.executionRuns.length);
  });

  it("falls back to seed model when storage payload is malformed", () => {
    const storage = createStorage();

    storage.setItem(
      "nexus.v1.phase1",
      JSON.stringify({
        state: { currentPage: "dashboard" },
        data: { workspaces: "bad-payload", tasks: null }
      })
    );

    const model = loadAppModel(storage);

    expect(model.data.workspaces[0]?.id).toBe("ws_personal");
    expect(model.data.tasks.length).toBeGreaterThan(0);
    expect(model.state.currentWorkspaceId).toBe("ws_personal");
  });

  it("falls back when execution runs are invalid", () => {
    const storage = createStorage();

    storage.setItem(
      "nexus.v1.phase1",
      JSON.stringify({
        state: {
          currentPage: "dashboard",
          currentWorkspaceId: "ws_personal",
          chatOpen: true,
          chatPinned: true,
          chatMode: "side",
          commandPaletteOpen: false,
          eventFilter: "all",
          eventSourceFilter: "all",
          eventQuery: "",
          taskView: "kanban"
        },
        data: {
          ...createInitialModel().data,
          executionRuns: [{ id: "run_bad", taskId: "task_1" }]
        }
      })
    );

    const model = loadAppModel(storage);

    expect(model.data.executionRuns.length).toBeGreaterThan(0);
  });
});

function createStorage() {
  const entries = new Map<string, string>();

  return {
    getItem(key: string) {
      return entries.has(key) ? entries.get(key)! : null;
    },
    setItem(key: string, value: string) {
      entries.set(key, value);
    }
  };
}
