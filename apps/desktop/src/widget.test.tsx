import { describe, expect, it } from "vitest";
import { readTodayWidgetTasks } from "./widget";

const APP_STATE_STORAGE_KEY = "mylife.desktop.app-state.v1";

describe("readTodayWidgetTasks", () => {
  it("reads in-progress today tasks from local storage", () => {
    window.localStorage.setItem(
      APP_STATE_STORAGE_KEY,
      JSON.stringify({
        tasks: [
          { id: "1", title: "今天进行中", status: "in_progress", isToday: true },
          { id: "2", title: "今天未开始", status: "not_started", isToday: true },
          { id: "3", title: "明天进行中", status: "in_progress", isToday: false }
        ]
      })
    );

    expect(readTodayWidgetTasks(window.localStorage)).toEqual([
      { id: "1", title: "今天进行中", status: "in_progress" }
    ]);
  });

  it("returns no live tasks when local storage is empty", () => {
    window.localStorage.removeItem(APP_STATE_STORAGE_KEY);
    expect(readTodayWidgetTasks(window.localStorage)).toEqual([]);
  });
});
