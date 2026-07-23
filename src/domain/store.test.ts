import { describe, expect, it } from "vitest";
import { createInitialState, reduceState } from "./store";

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
