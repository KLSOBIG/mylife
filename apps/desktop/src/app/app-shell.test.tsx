import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { seedTasks, themePresets } from "../lib/task-state";
import { AppShell } from "./app-shell";

const APP_STATE_STORAGE_KEY = "mylife.desktop.app-state.v1";

describe("AppShell", () => {
  beforeEach(() => {
    window.localStorage.removeItem(APP_STATE_STORAGE_KEY);
  });

  it("renders today header", () => {
    render(<AppShell />);
    expect(screen.getByRole("heading", { name: "今天" })).toBeInTheDocument();
  });

  it("shows a full month calendar in the left pane", () => {
    render(<AppShell />);
    expect(screen.getByRole("heading", { name: "日历" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /2026年6月1日/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /2026年6月30日/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /2026年5月31日/ })).toBeInTheDocument();
  });

  it("uses one real tab set instead of duplicated action rows", () => {
    render(<AppShell />);
    const detailTabs = screen.getByRole("tablist", { name: "task-detail-tabs" });
    expect(screen.getByRole("tab", { name: "任务详情" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "甘特图" })).toBeInTheDocument();
    expect(detailTabs.querySelectorAll('[role="tab"]')).toHaveLength(2);
  });

  it("creates task without requiring an explicit save button", async () => {
    const user = userEvent.setup();
    render(<AppShell />);

    await user.click(screen.getByRole("button", { name: /快速新增/i }));

    const input = screen.getByPlaceholderText("输入任务标题");
    await user.type(input, "自动保存任务");
    fireEvent.blur(input);

    expect(screen.queryByRole("button", { name: "保存任务" })).not.toBeInTheDocument();
    expect(screen.getAllByText("自动保存任务").length).toBeGreaterThan(0);
  });

  it("keeps markdown editor as the dominant editable area in details", () => {
    render(<AppShell />);
    expect(screen.getByLabelText("rich-editor")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Markdown" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "预览" })).not.toBeInTheDocument();
  });

  it("hydrates stored markdown into editor and task linkage", () => {
    const storedTasks = seedTasks();
    storedTasks[0] = {
      ...storedTasks[0],
      document: "# 已自动保存\n\n- [ ] 刷新后还在\n- [x] 已完成联动项"
    };

    window.localStorage.setItem(
      APP_STATE_STORAGE_KEY,
      JSON.stringify({
        tasks: storedTasks,
        selectedTaskId: storedTasks[0].id,
        selectedDate: new Date(2026, 5, 30, 9, 0, 0).toISOString(),
        selectedWorkspace: "my-work",
        theme: "olive",
        themeSettings: themePresets.olive
      })
    );

    render(<AppShell />);

    expect(screen.getByLabelText("rich-editor").textContent).toContain("已自动保存");
    expect(screen.getAllByText("刷新后还在").length).toBeGreaterThan(0);
    expect(screen.getAllByText("已完成联动项").length).toBeGreaterThan(0);
  });
});
