import { useMemo, useState } from "react";
import type { AttentionLevel, TaskItem, TaskStatus, TaskView } from "../../domain/types";
import { Dialog } from "../common/dialog";
import { EmptyState } from "../common/empty-state";

const columns: Array<{ id: TaskStatus; label: string }> = [
  { id: "pending_assignment", label: "待分配" },
  { id: "assigned", label: "已分配" },
  { id: "in_progress", label: "进行中" },
  { id: "pending_review", label: "待审核" },
  { id: "completed", label: "已完成" }
];

const statusFlow: Record<TaskStatus, TaskStatus[]> = {
  pending_assignment: ["assigned"],
  assigned: ["in_progress", "returned"],
  in_progress: ["pending_review", "suspended"],
  pending_review: ["completed", "returned"],
  completed: [],
  suspended: ["in_progress"],
  escalated: ["pending_review"],
  returned: ["assigned"]
};

type TaskCreateDraft = {
  title: string;
  description: string;
  type: TaskItem["type"];
  priority: TaskItem["priority"];
  level: AttentionLevel;
  status: TaskStatus;
  dueAt: string;
};

export function TasksPage(props: {
  tasks: TaskItem[];
  selectedTaskId?: string;
  onSelect: (taskId: string) => void;
  onStatusChange?: (taskId: string, nextStatus: TaskStatus) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  viewMode?: TaskView;
  onViewModeChange?: (viewMode: TaskView) => void;
  onCreate?: (draft: {
    title: string;
    description: string;
    type: TaskItem["type"];
    priority: TaskItem["priority"];
    level: AttentionLevel;
    status: TaskStatus;
    dueAt?: string;
  }) => void;
}) {
  const [searchDraft, setSearchDraft] = useState("");
  const [viewDraft, setViewDraft] = useState<TaskView>("kanban");
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<TaskCreateDraft>({
    title: "",
    description: "",
    type: "action",
    priority: "medium",
    level: "L2",
    status: "pending_assignment",
    dueAt: ""
  });

  const searchValue = props.searchQuery ?? searchDraft;
  const activeView = props.viewMode ?? viewDraft;
  const visibleTasks = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    return props.tasks.filter((item) => {
      if (!normalized) {
        return true;
      }
      return [item.title, item.description, item.type, item.priority, item.level, item.status, item.source ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [props.tasks, searchValue]);

  const setViewMode = (nextView: TaskView) => {
    if (props.viewMode === undefined) {
      setViewDraft(nextView);
    }
    props.onViewModeChange?.(nextView);
  };

  return (
    <div className="page-body">
      <div className="toolbar">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <input
            aria-label="搜索任务"
            onChange={(event) => {
              const next = event.target.value;
              if (props.searchQuery === undefined) {
                setSearchDraft(next);
              }
              props.onSearchChange?.(next);
            }}
            placeholder="搜索标题、描述、状态、优先级、来源"
            style={{
              flex: "1 1 320px",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "11px 14px",
              outline: "none"
            }}
            value={searchValue}
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div className="chips" role="tablist" aria-label="任务视图切换">
              {([
                { id: "kanban" as const, label: "看板" },
                { id: "list" as const, label: "列表" }
              ]).map((item) => (
                <button
                  aria-pressed={activeView === item.id}
                  className={activeView === item.id ? "chip active" : "chip"}
                  key={item.id}
                  onClick={() => setViewMode(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button className="btn primary" onClick={() => setCreateOpen(true)} type="button">
              创建任务
            </button>
          </div>
        </div>
      </div>
      {activeView === "list" ? (
        <div className="list-wrap">
          {visibleTasks.length ? (
            visibleTasks.map((item) => (
              <button
                type="button"
                key={item.id}
                className={item.id === props.selectedTaskId ? "task-card selected" : "task-card"}
                onClick={() => props.onSelect(item.id)}
              >
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <span>
                  {item.status} / {item.level} / {item.priority}
                </span>
              </button>
            ))
          ) : (
            <EmptyState description="先放宽筛选或新建任务。" title="没有匹配任务" />
          )}
        </div>
      ) : (
        <div className="kanban">
          {columns.map((column) => {
            const columnTasks = visibleTasks.filter((item) => item.status === column.id);
            return (
              <section key={column.id} className="kanban-column">
                <header className="kanban-column-header">
                  <h3>{column.label}</h3>
                  <span>{columnTasks.length}</span>
                </header>
                <div className="kanban-stack">
                  {columnTasks.length ? (
                    columnTasks.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={item.id === props.selectedTaskId ? "task-card selected" : "task-card"}
                        onClick={() => props.onSelect(item.id)}
                      >
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                        <span>
                          {item.level} / {item.priority}
                        </span>
                      </button>
                    ))
                  ) : (
                    <EmptyState description="拖任务进来或新建一条。" title="这里空" />
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <Dialog
        description="先创建卡片，再由主线程接任务数据。"
        onClose={() => setCreateOpen(false)}
        open={createOpen}
        title="创建任务"
        footer={
          <>
            <button className="btn secondary" onClick={() => setCreateOpen(false)} type="button">
              取消
            </button>
            <button
              className="btn primary"
              onClick={() => {
                props.onCreate?.({
                  title: draft.title.trim(),
                  description: draft.description.trim(),
                  type: draft.type,
                  priority: draft.priority,
                  level: draft.level,
                  status: draft.status,
                  dueAt: draft.dueAt.trim() || undefined
                });
                setDraft({
                  title: "",
                  description: "",
                  type: "action",
                  priority: "medium",
                  level: "L2",
                  status: "pending_assignment",
                  dueAt: ""
                });
                setCreateOpen(false);
              }}
              type="button"
            >
              创建
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
            <span>标题</span>
            <input
              onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))}
              style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
              value={draft.title}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
            <span>描述</span>
            <textarea
              onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))}
              rows={4}
              style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px", resize: "vertical" }}
              value={draft.description}
            />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
              <span>类型</span>
              <select
                onChange={(event) => setDraft((value) => ({ ...value, type: event.target.value as TaskItem["type"] }))}
                style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
                value={draft.type}
              >
                {["event", "action", "system", "plugin"].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
              <span>优先级</span>
              <select
                onChange={(event) => setDraft((value) => ({ ...value, priority: event.target.value as TaskItem["priority"] }))}
                style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
                value={draft.priority}
              >
                {["urgent", "high", "medium", "low"].map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
              <span>注意力级别</span>
              <select
                onChange={(event) => setDraft((value) => ({ ...value, level: event.target.value as AttentionLevel }))}
                style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
                value={draft.level}
              >
                {["L3", "L2", "L1", "L0"].map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
              <span>初始状态</span>
              <select
                onChange={(event) => setDraft((value) => ({ ...value, status: event.target.value as TaskStatus }))}
                style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
                value={draft.status}
              >
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
            <span>截止时间</span>
            <input
              onChange={(event) => setDraft((value) => ({ ...value, dueAt: event.target.value }))}
              placeholder="可选"
              style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
              value={draft.dueAt}
            />
          </label>
        </div>
      </Dialog>
    </div>
  );
}

export { statusFlow };
