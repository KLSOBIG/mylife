import { describe, expect, it } from "vitest";
import { loadAppModel, saveAppModel } from "./persistence";
import { createInitialModel } from "./store";

describe("persistence", () => {
  it("loads default model when storage is empty", () => {
    const storage = createStorage();
    const model = loadAppModel(storage);

    expect(model.data.tasks.length).toBeGreaterThan(0);
    expect(model.state.currentWorkspaceId).toBe("ws_personal");
  });

  it("persists changed task status", () => {
    const model = createInitialModel();
    model.data.tasks[0]!.status = "completed";
    const storage = createStorage();

    saveAppModel(model, storage);

    expect(loadAppModel(storage).data.tasks[0]!.status).toBe("completed");
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
