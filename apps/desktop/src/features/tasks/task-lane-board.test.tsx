import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { moveTaskSummaries } from "../../lib/task-state";
import type { TaskSummary } from "../../lib/types";
import { TaskLaneBoard } from "./task-lane-board";
import { TodayBoard } from "./today-board";

const sampleTasks: TaskSummary[] = [
  {
    id: "task-1",
    title: "重构任务时间轴存储",
    status: "in_progress",
    isToday: true,
    reminderLabel: "今天 14:00",
    checklistCount: 2
  },
  {
    id: "task-2",
    title: "设计桌面小窗交互",
    status: "in_progress",
    isToday: false,
    reminderLabel: "明天 09:00",
    checklistCount: 1
  },
  {
    id: "task-3",
    title: "清理旧提醒",
    status: "not_started",
    isToday: true,
    reminderLabel: "今天 18:00",
    checklistCount: 0
  }
];

describe("TaskLaneBoard", () => {
  it("renders compact vertical lanes with status counts", () => {
    render(<TaskLaneBoard tasks={sampleTasks} />);

    expect(screen.getByLabelText("task-lane-board")).toHaveAttribute(
      "data-orientation",
      "vertical"
    );
    expect(screen.getByRole("button", { name: "未开始 · 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "进行中 · 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "已完成 · 0" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "废弃 · 0" })).toBeInTheDocument();
    expect(screen.getByText("重构任务时间轴存储")).toBeInTheDocument();
    expect(screen.getAllByText("今天")).toHaveLength(2);
    expect(screen.getByText("2 子任务")).toBeInTheDocument();
    expect(screen.getByLabelText("拖拽 重构任务时间轴存储")).toBeInTheDocument();
  });

  it("collapses lane body on toggle", async () => {
    render(<TaskLaneBoard tasks={sampleTasks} />);

    fireEvent.click(screen.getByRole("button", { name: "进行中 · 2" }));

    expect(screen.queryByText("重构任务时间轴存储")).not.toBeInTheDocument();
    expect(screen.queryByText("设计桌面小窗交互")).not.toBeInTheDocument();
  });

  it("reorders inside lane and updates status across lanes", () => {
    const reordered = moveTaskSummaries(sampleTasks, {
      taskId: "task-2",
      toStatus: "in_progress",
      toIndex: 0
    });

    expect(reordered.map((task) => task.id)).toEqual(["task-3", "task-2", "task-1"]);

    const moved = moveTaskSummaries(sampleTasks, {
      taskId: "task-1",
      toStatus: "completed",
      toIndex: 0
    });

    expect(moved.find((task) => task.id === "task-1")?.status).toBe("completed");
    expect(moved.map((task) => `${task.status}:${task.id}`)).toEqual([
      "not_started:task-3",
      "in_progress:task-2",
      "completed:task-1"
    ]);
  });
});

describe("TodayBoard inline creator", () => {
  function Harness() {
    const [tasks, setTasks] = useState<TaskSummary[]>(sampleTasks);
    const [draftTitle, setDraftTitle] = useState("");
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [saveCount, setSaveCount] = useState(0);
    const onSave = () => {
      if (!draftTitle.trim()) {
        return;
      }

      setSaveCount((current) => current + 1);
      setTasks((current) => [
        {
          id: `task-${current.length + 1}`,
          title: draftTitle.trim(),
          status: "not_started",
          isToday: true,
          checklistCount: 0
        },
        ...current
      ]);
      setDraftTitle("");
      setIsComposerOpen(false);
    };

    return (
      <>
        <TodayBoard
          tasks={tasks}
          draftTitle={draftTitle}
          isComposerOpen={isComposerOpen}
          onDraftTitleChange={setDraftTitle}
          onCreateClick={() => setIsComposerOpen(true)}
          onCreateSave={onSave}
        />
        <output aria-label="save-count">{String(saveCount)}</output>
      </>
    );
  }

  it("auto-saves on blur and discards blank drafts", async () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /快速新增/i }));
    const input = screen.getByPlaceholderText("输入任务标题");
    fireEvent.change(input, { target: { value: "自动保存任务" } });
    fireEvent.blur(input);

    expect(screen.getByText("自动保存任务")).toBeInTheDocument();
    expect(screen.getByLabelText("save-count")).toHaveTextContent("1");
    expect(screen.queryByRole("button", { name: "保存任务" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /快速新增/i }));
    const blankInput = screen.getByPlaceholderText("输入任务标题");
    fireEvent.change(blankInput, { target: { value: "   " } });
    fireEvent.blur(blankInput);

    expect(screen.getByLabelText("save-count")).toHaveTextContent("1");
  });
});
