import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TaskDetail } from "../../lib/types";
import { TaskDetailPane } from "./task-detail-pane";

const fakeTask: TaskDetail = {
  id: "task_1",
  title: "重构任务时间轴存储",
  document: "# 重构任务时间轴存储\n\n- [ ] 定义 task_events 表\n- [x] 补状态颜色映射",
  reminder: {
    enabled: true,
    dateTime: "2026-06-30T14:00",
    repeatKind: "weekly",
    weekdays: [1, 3, 5]
  },
  checklist: [
    { id: "item_1", title: "定义 task_events 表", status: "not_started" }
  ],
  status: "in_progress",
  timeline: {
    rows: [
      {
        id: "row_1",
        title: "主任务",
        segments: [
          { id: "seg_1", status: "in_progress", startAt: "2026-06-30T09:00:00.000Z", endAt: "2026-07-02T18:00:00.000Z" }
        ]
      }
    ]
  }
};

describe("TaskDetailPane", () => {
  it("renders markdown-first details layout with compact secondary info", () => {
    render(<TaskDetailPane task={fakeTask} />);
    expect(screen.getByRole("tablist", { name: "task-detail-tabs" })).toBeInTheDocument();
    expect(screen.getByLabelText("rich-editor")).toBeInTheDocument();
    expect(screen.queryByLabelText("markdown-preview")).not.toBeInTheDocument();
    expect(screen.getByText("进行中")).toBeInTheDocument();
    expect(screen.getByText("提醒")).toBeInTheDocument();
    expect(screen.getAllByText("6/30 14:00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("周一 / 周三 / 周五").length).toBeGreaterThan(0);
  });

  it("switches tabs through callback when controlled", () => {
    const handleTabChange = vi.fn();

    render(<TaskDetailPane task={fakeTask} activeTab="details" onTabChange={handleTabChange} />);

    fireEvent.click(screen.getByRole("tab", { name: "甘特图" }));

    expect(handleTabChange).toHaveBeenCalledWith("gantt");
  });

  it("opens reminder editor controls when reminder summary is clicked", () => {
    render(<TaskDetailPane task={fakeTask} />);

    fireEvent.click(screen.getByRole("button", { name: /提醒/ }));

    expect(screen.getByRole("group", { name: "reminder-editor" })).toBeInTheDocument();
    expect(screen.getByLabelText("weekly-days")).toBeInTheDocument();
  });
});
