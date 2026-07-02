import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { buildTaskSummary, moveTaskSummaries, type TaskRecord } from "../../lib/task-state";
import type { TaskSummary } from "../../lib/types";
import { TaskLaneBoard, taskCardPointerActivationConstraint } from "./task-lane-board";
import { TodayBoard } from "./today-board";

const sampleRecords: TaskRecord[] = [
  {
    id: "task-1",
    workspaceId: "my-work",
    title: "重构任务时间轴存储",
    status: "in_progress",
    isToday: true,
    reminder: { at: "今天 14:00", repeat: "每周一 / 每周三 / 每周五" },
    checklist: [
      { id: "task-1-1", title: "定义 task_events 表", status: "not_started" },
      { id: "task-1-2", title: "补状态颜色映射", status: "completed" }
    ],
    document: [
      "- [ ] 定义 task_events 表",
      "  - [x] 已完成子任务",
      "  - [ ] 进行中子任务",
      "- [x] 补状态颜色映射"
    ].join("\n"),
    timeline: []
  },
  {
    id: "task-2",
    workspaceId: "my-work",
    title: "设计桌面小窗交互",
    status: "in_progress",
    isToday: false,
    reminder: { at: "明天 09:00", repeat: "每天" },
    checklist: [{ id: "task-2-1", title: "定义小窗按钮状态", status: "not_started" }],
    document: "- [ ] 定义小窗按钮状态",
    timeline: []
  },
  {
    id: "task-3",
    workspaceId: "study",
    title: "清理旧提醒",
    status: "not_started",
    isToday: true,
    reminder: { at: "今天 18:00", repeat: "每周一 / 每周三 / 每周五" },
    checklist: [],
    document: "",
    timeline: []
  }
];

const sampleTasks: TaskSummary[] = sampleRecords.map(buildTaskSummary);

describe("TaskLaneBoard", () => {
  it("uses near-immediate pointer activation so drag starts in place", () => {
    expect(taskCardPointerActivationConstraint.distance).toBe(1);
  });

  it("renders compact vertical lanes with status counts", () => {
    render(<TaskLaneBoard tasks={sampleTasks} />);

    expect(screen.getByLabelText("task-lane-board")).toHaveAttribute(
      "data-orientation",
      "vertical"
    );
    expect(screen.getByRole("button", { name: "未开始 · 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "进行中 · 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "搁置 · 0" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "已完成 · 0" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "废弃 · 0" })).toBeInTheDocument();
    expect(screen.getByText("重构任务时间轴存储")).toBeInTheDocument();
    expect(screen.getAllByText("今天")).toHaveLength(2);
    expect(sampleTasks[0].checklistTree?.[0].title).toBe("定义 task_events 表");
    expect(screen.queryByRole("tree", { name: "重构任务时间轴存储 任务树预览" })).not.toBeInTheDocument();
  });

  it("collapses lane body on toggle", async () => {
    render(<TaskLaneBoard tasks={sampleTasks} />);

    fireEvent.click(screen.getByRole("button", { name: "进行中 · 2" }));

    expect(screen.queryByText("重构任务时间轴存储")).not.toBeInTheDocument();
    expect(screen.queryByText("设计桌面小窗交互")).not.toBeInTheDocument();
  });

  it("expands task tree inside card without stealing selection", () => {
    const onSelectTask = vi.fn();
    render(<TaskLaneBoard tasks={sampleTasks} onSelectTask={onSelectTask} />);

    fireEvent.click(screen.getByRole("button", { name: "展开 重构任务时间轴存储 任务树" }));

    const tree = screen.getByRole("tree", { name: "重构任务时间轴存储 任务树预览" });
    expect(tree).toHaveStyle({ maxHeight: "192px", overflowY: "auto" });
    expect(screen.getByText("定义 task_events 表")).toBeInTheDocument();
    expect(screen.getByText("已完成子任务")).toBeInTheDocument();
    expect(screen.getByText("进行中子任务")).toBeInTheDocument();
    expect(screen.getByText("补状态颜色映射")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "重构任务时间轴存储" }));
    expect(onSelectTask).toHaveBeenCalledWith("task-1");
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
          isToday: true
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

  it("reopens creator after blank discard when create is clicked again", async () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /快速新增/i }));
    const input = screen.getByPlaceholderText("输入任务标题");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.blur(input);

    expect(screen.queryByPlaceholderText("输入任务标题")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /快速新增/i }));
    expect(screen.getByPlaceholderText("输入任务标题")).toBeInTheDocument();
  });
});
