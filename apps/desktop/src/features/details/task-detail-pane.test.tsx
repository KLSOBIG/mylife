import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskDetailPane } from "./task-detail-pane";

const fakeTask = {
  id: "task_1",
  title: "重构任务时间轴存储",
  document: "- [ ] 定义 task_events 表",
  reminder: {
    at: "2026-06-30 14:00",
    repeat: "每周一 / 每周三 / 每周五"
  },
  checklist: [
    { id: "item_1", title: "定义 task_events 表", status: "not_started" }
  ]
};

describe("TaskDetailPane", () => {
  it("renders reminder editor and extracted checklist", () => {
    render(<TaskDetailPane task={fakeTask} />);
    expect(screen.getByText("提醒设置")).toBeInTheDocument();
    expect(screen.getByText("定义 task_events 表")).toBeInTheDocument();
  });
});
