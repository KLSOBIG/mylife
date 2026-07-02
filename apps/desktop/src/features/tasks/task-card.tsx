import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { useId, useState } from "react";
import { statusMeta } from "../../lib/task-state";
import type { ChecklistTreeNode, TaskSummary } from "../../lib/types";

function ChecklistTreeBranch({
  nodes,
  depth = 0
}: {
  nodes: ChecklistTreeNode[];
  depth?: number;
}) {
  return (
    <ul
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: 8
      }}
    >
      {nodes.map((node) => (
        <li key={node.id} role="treeitem" aria-level={node.depth + 1}>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              paddingLeft: depth * 14
            }}
          >
            <span
              style={{
                flex: "0 0 auto",
                padding: "2px 6px",
                borderRadius: 999,
                fontSize: 11,
                lineHeight: 1.4,
                color: node.checked ? "#2d6a4f" : "#8a6a37",
                background: node.checked ? "#edf7f0" : "#fff4dc"
              }}
            >
              {node.checked ? "已完成" : "未完成"}
            </span>
            <span style={{ minWidth: 0, color: "#3a3229", fontSize: 13 }}>{node.title}</span>
          </div>
          {node.children.length > 0 ? <ChecklistTreeBranch nodes={node.children} depth={depth + 1} /> : null}
        </li>
      ))}
    </ul>
  );
}

function TaskCardBody({
  task,
  onSelectTask,
  onCompleteTask,
  onShelveTask,
  onResumeTask,
  onToggleTree,
  expanded,
  draggable = false,
  dragging = false,
  overlay = false
}: {
  task: TaskSummary;
  onSelectTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onShelveTask?: (taskId: string) => void;
  onResumeTask?: (taskId: string) => void;
  onToggleTree?: () => void;
  expanded?: boolean;
  draggable?: boolean;
  dragging?: boolean;
  overlay?: boolean;
}) {
  const treeNodes = task.checklistTree ?? [];
  const treeId = useId();
  const hasTree = treeNodes.length > 0;

  return (
    <div
      className="task-card"
      data-dragging={dragging ? "true" : "false"}
      data-overlay={overlay ? "true" : "false"}
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
        opacity: overlay ? 0.96 : 1,
        transform: dragging ? "translateY(-1px) scale(1.01)" : "translateY(0) scale(1)",
        transition:
          "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 220ms cubic-bezier(0.2, 0.8, 0.2, 1), border-color 180ms ease, background-color 180ms ease, opacity 180ms ease"
      }}
    >
      <div
        className="task-card__header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          gap: 10
        }}
      >
        {!overlay && hasTree ? (
          <button
            type="button"
            aria-label={`${expanded ? "收起" : "展开"} ${task.title} 任务树`}
            aria-expanded={expanded ? "true" : "false"}
            aria-controls={`task-tree-${treeId}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleTree?.();
            }}
            className={`task-card__tree-toggle ${expanded ? "is-expanded" : ""}`}
          >
            <span aria-hidden="true">▶</span>
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onSelectTask?.(task.id)}
          className={`task-card__title ${draggable ? "is-draggable" : ""}`}
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
        {task.reminderLabel ? (
          <span style={{ fontSize: 12, color: "#7c6a55" }}>{task.reminderLabel}</span>
        ) : null}
      </div>
      {!overlay ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {task.status !== "completed" && task.status !== "abandoned" ? (
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
          {task.status === "in_progress" && onShelveTask ? (
            <button
              type="button"
              onClick={() => onShelveTask(task.id)}
              style={{
                border: "1px solid #d8c9b2",
                background: "#fffaf1",
                color: "#7a5d34",
                borderRadius: 999,
                padding: "6px 10px",
                cursor: "pointer"
              }}
            >
              搁置
            </button>
          ) : null}
          {task.status === "shelved" && onResumeTask ? (
            <button
              type="button"
              onClick={() => onResumeTask(task.id)}
              style={{
                border: "1px solid #d8c9b2",
                background: "#f2f0ff",
                color: "#5d5aa0",
                borderRadius: 999,
                padding: "6px 10px",
                cursor: "pointer"
              }}
            >
              恢复进行
            </button>
          ) : null}
        </div>
      ) : null}
      {!overlay && expanded && hasTree ? (
        <section
          id={`task-tree-${treeId}`}
          role="tree"
          aria-label={`${task.title} 任务树预览`}
          style={{
            maxHeight: 192,
            overflowY: "auto",
            minHeight: 0,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #e6d8c4",
            background: "#fffaf2"
          }}
        >
          <ChecklistTreeBranch nodes={treeNodes} />
        </section>
      ) : null}
    </div>
  );
}

export function TaskCard({
  task,
  onSelectTask,
  onCompleteTask,
  onShelveTask,
  onResumeTask
}: {
  task: TaskSummary;
  onSelectTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onShelveTask?: (taskId: string) => void;
  onResumeTask?: (taskId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
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
      className="task-card-shell"
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 180ms ease",
        opacity: isDragging ? 0.44 : 1,
        zIndex: isDragging ? 2 : 0,
        willChange: "transform, opacity",
        cursor: isDragging ? "grabbing" : "grab"
      }}
    >
      <TaskCardBody
        task={task}
        onSelectTask={onSelectTask}
        onCompleteTask={onCompleteTask}
        onShelveTask={onShelveTask}
        onResumeTask={onResumeTask}
        onToggleTree={() => setExpanded((current) => !current)}
        expanded={expanded}
        draggable
        dragging={isDragging}
      />
    </div>
  );
}

export function TaskCardOverlay({ task }: { task: TaskSummary }) {
  return <TaskCardBody task={task} overlay dragging />;
}
