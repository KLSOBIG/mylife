import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import type { TaskLane as TaskLaneType, TaskStatus } from "../../lib/types";
import { TaskCard } from "./task-card";
import { TaskInlineCreator } from "./task-inline-creator";

export function TaskLane({
  lane,
  collapsed,
  showInlineCreator = false,
  draftTitle = "",
  onToggle,
  onDraftTitleChange,
  onCreateSave,
  onCreateDiscard,
  onSelectTask,
  onCompleteTask,
  onAdvanceTask
}: {
  lane: TaskLaneType;
  collapsed: boolean;
  showInlineCreator?: boolean;
  draftTitle?: string;
  onToggle?: (status: TaskStatus) => void;
  onDraftTitleChange?: (value: string) => void;
  onCreateSave?: () => void;
  onCreateDiscard?: () => void;
  onSelectTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onAdvanceTask?: (taskId: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `lane:${lane.status}`,
    data: {
      type: "lane",
      status: lane.status
    }
  });

  return (
    <article
      className="task-lane"
      data-lane-status={lane.status}
      style={{
        border: isOver ? "1px solid #9b7a4c" : "1px solid #ddd6c8",
        borderRadius: 18,
        padding: 14,
        background: isOver ? "#fff7e9" : "#fffdfa"
      }}
    >
      <button
        type="button"
        onClick={() => onToggle?.(lane.status)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: 0,
          border: 0,
          background: "transparent",
          color: "#2f2a24",
          cursor: "pointer"
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15 }}>
          {lane.label} · {lane.count}
        </span>
        <span aria-hidden="true" style={{ color: "#8f7656" }}>
          {collapsed ? "展开" : "收起"}
        </span>
      </button>
      {!collapsed ? (
        <div
          ref={setNodeRef}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 12,
            minHeight: 16
          }}
        >
          {showInlineCreator ? (
            <TaskInlineCreator
              value={draftTitle}
              onChange={onDraftTitleChange}
              onSave={onCreateSave}
              onDiscard={onCreateDiscard}
            />
          ) : null}
          <SortableContext items={lane.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
            {lane.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onSelectTask={onSelectTask}
                onCompleteTask={onCompleteTask}
                onAdvanceTask={onAdvanceTask}
              />
            ))}
          </SortableContext>
          {lane.tasks.length === 0 && !showInlineCreator ? (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px dashed #ddcfb9",
                color: "#8f7656",
                fontSize: 13
              }}
            >
              拖到这里切换状态
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
