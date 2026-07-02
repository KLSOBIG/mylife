import { fireEvent, render, screen, within } from "@testing-library/react";
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

  it("anchors theme settings sheet above settings trigger", async () => {
    const user = userEvent.setup();
    render(<AppShell />);

    await user.click(screen.getByRole("button", { name: "设置" }));

    const trigger = screen.getByRole("button", { name: "设置" });
    const sheet = screen.getByRole("dialog", { name: "主题设置" });
    const panel = trigger.parentElement;

    expect(panel?.firstElementChild).toBe(sheet);
    expect(panel?.lastElementChild).toBe(trigger);
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

  it("switches workspaces like tenants and filters task set", async () => {
    const user = userEvent.setup();
    render(<AppShell />);

    expect(screen.getByRole("button", { name: "重构任务时间轴存储" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "整理产品实验路线图" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "产品实验" }));

    expect(screen.getByRole("button", { name: "整理产品实验路线图" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "重构任务时间轴存储" })).not.toBeInTheDocument();
  });

  it("stacks multiple undo toasts instead of replacing earlier ones", async () => {
    const user = userEvent.setup();
    render(<AppShell />);

    await user.click(screen.getByRole("button", { name: "重构任务时间轴存储" }));
    await user.click(within(screen.getByLabelText("details-pane")).getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "设计桌面小窗交互" }));
    await user.click(within(screen.getByLabelText("details-pane")).getByRole("button", { name: "恢复进行" }));

    expect(screen.getByText("任务已切换到 已完成")).toBeInTheDocument();
    expect(screen.getByText("任务已切换到 进行中")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "撤销" })).toHaveLength(2);
  });

  it("shows in-app reminder alert when a reminder is due", () => {
    const storedTasks = seedTasks();
    storedTasks[0] = {
      ...storedTasks[0],
      reminder: {
        enabled: true,
        dateTime: new Date(Date.now() - 60_000).toISOString(),
        repeatKind: "none",
        weekdays: [],
        at: "刚刚",
        repeat: "不重复"
      }
    };

    window.localStorage.setItem(
      APP_STATE_STORAGE_KEY,
      JSON.stringify({
        tasks: storedTasks,
        selectedTaskId: storedTasks[0].id,
        selectedDate: new Date().toISOString(),
        selectedWorkspace: "my-work",
        theme: "olive",
        themeSettings: themePresets.olive
      })
    );

    render(<AppShell />);

    expect(screen.getByText("提醒到点")).toBeInTheDocument();
    expect(screen.getByText("刚刚")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开任务" })).toBeInTheDocument();
  });
});
