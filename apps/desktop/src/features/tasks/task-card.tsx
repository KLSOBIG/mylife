import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { statusMeta } from "../../lib/task-state";
import type { TaskSummary } from "../../lib/types";

function TaskCardBody({
  task,
  onSelectTask,
  onCompleteTask,
  onAdvanceTask,
  dragHandleProps,
  dragging = false,
  overlay = false
}: {
  task: TaskSummary;
  onSelectTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onAdvanceTask?: (taskId: string) => void;
  dragHandleProps?: Record<string, unknown>;
  dragging?: boolean;
  overlay?: boolean;
}) {
  const nextStatus = statusMeta[task.status].next;

  return (
    <div
      className="task-card"
      data-dragging={dragging ? "true" : "false"}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 16,
        border: dragging ? "1px solid #9b7a4c" : "1px solid #e5dac7",
        background: dragging ? "#fff6df" : "#ffffff",
        boxShadow: dragging
          ? "0 14px 28px rgba(118, 84, 35, 0.18)"
          : "0 4px 12px rgba(47, 42, 36, 0.06)",
        opacity: overlay ? 0.96 : 1
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10
        }}
      >
        <button
          type="button"
          onClick={() => onSelectTask?.(task.id)}
          style={{
            flex: 1,
            padding: 0,
            border: 0,
            background: "transparent",
            textAlign: "left",
            color: "#2f2a24",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 15
          }}
        >
          {task.title}
        </button>
        {!overlay ? (
          <button
            type="button"
            aria-label={`拖拽 ${task.title}`}
            style={{
              border: 0,
              background: "transparent",
              color: "#8f7656",
              cursor: "grab",
              fontSize: 18,
              lineHeight: 1
            }}
            {...dragHandleProps}
          >
            ⋮⋮
          </button>
        ) : null}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center"
        }}
      >
        <span
          className={`task-chip ${statusMeta[task.status].chipClass}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 8px",
            borderRadius: 999,
            fontSize: 12
          }}
        >
          {statusMeta[task.status].label}
        </span>
        {task.isToday ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 8px",
              borderRadius: 999,
              fontSize: 12,
              color: "#6f5128",
              background: "#f8e4b9"
            }}
          >
            今天
          </span>
        ) : null}
        {typeof task.checklistCount === "number" ? (
          <span style={{ fontSize: 12, color: "#7c6a55" }}>{task.checklistCount} 子任务</span>
        ) : null}
        {task.reminderLabel ? (
          <span style={{ fontSize: 12, color: "#7c6a55" }}>{task.reminderLabel}</span>
        ) : null}
      </div>
      {!overlay ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {task.status !== "completed" ? (
            <button
              type="button"
              className="task-complete"
              onClick={() => onCompleteTask?.(task.id)}
              style={{
                border: 0,
                background: "#edf7f0",
                color: "#2d6a4f",
                borderRadius: 999,
                padding: "6px 10px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              完成
            </button>
          ) : null}
          {nextStatus && onAdvanceTask ? (
            <button
              type="button"
              onClick={() => onAdvanceTask(task.id)}
              style={{
                border: "1px solid #d8c9b2",
                background: "#fffaf1",
                color: "#7a5d34",
                borderRadius: 999,
                padding: "6px 10px",
                cursor: "pointer"
              }}
            >
              下一状态
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function TaskCard({
  task,
  onSelectTask,
  onCompleteTask,
  onAdvanceTask
}: {
  task: TaskSummary;
  onSelectTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onAdvanceTask?: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: "task",
      status: task.status
    }
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.48 : 1
      }}
    >
      <TaskCardBody
        task={task}
        onSelectTask={onSelectTask}
        onCompleteTask={onCompleteTask}
        onAdvanceTask={onAdvanceTask}
        dragHandleProps={{ ...attributes, ...listeners }}
        dragging={isDragging}
      />
    </div>
  );
}

export function TaskCardOverlay({ task }: { task: TaskSummary }) {
  return <TaskCardBody task={task} overlay dragging />;
}
