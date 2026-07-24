import { useMemo, useState } from "react";
import type { AttentionLevel, TaskItem, TaskStatus, TaskView } from "../../domain/types";
import { Dialog } from "../common/dialog";
import { EmptyState } from "../common/empty-state";

const columns: Array<{ id: string; label: string; statuses: TaskStatus[] }> = [
  { id: "awaiting", label: "待分配", statuses: ["pending_assignment", "returned"] },
  { id: "active", label: "进行中", statuses: ["assigned", "in_progress", "suspended", "pending_review", "escalated"] },
  { id: "done", label: "已完成", statuses: ["completed"] }
];

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
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
}) {
  const [searchDraft, setSearchDraft] = useState("");
  const [viewDraft, setViewDraft] = useState<TaskView>("kanban");
  const [createDraftOpen, setCreateDraftOpen] = useState(false);
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
  const createOpen = props.createOpen ?? createDraftOpen;
  const setCreateOpen = (open: boolean) => {
    props.onCreateOpenChange?.(open);
    if (props.createOpen === undefined) {
      setCreateDraftOpen(open);
    }
    if (!open) {
      resetDraft();
    }
  };
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
        <div className="tasks-toolbar">
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
            className="tasks-search"
            value={searchValue}
          />
          <div className="tasks-toolbar-actions">
            <div className="view-toggle" role="tablist" aria-label="任务视图切换">
              {([
                { id: "kanban" as const, label: "看板" },
                { id: "list" as const, label: "列表" }
              ]).map((item) => (
                <button
                  aria-pressed={activeView === item.id}
                  className={activeView === item.id ? "view-btn active" : "view-btn"}
                  key={item.id}
                  onClick={() => setViewMode(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button className="btn btn-p" onClick={() => setCreateOpen(true)} type="button">
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
                <div className="kanban-card-title">{item.title}</div>
                <p>{item.description}</p>
                <div className="kanban-card-meta">
                  <span className={`tag tag--${item.level.toLowerCase()}`}>{item.level}</span>
                  <span>{statusLabel(item.status)}</span>
                  <span>{priorityLabel(item.priority)}</span>
                </div>
              </button>
            ))
          ) : (
            <EmptyState description="先放宽筛选或新建任务。" title="没有匹配任务" />
          )}
        </div>
      ) : (
        <div className="kanban">
          {columns.map((column) => {
            const columnTasks = visibleTasks.filter((item) => column.statuses.includes(item.status));
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
                        <div className="kanban-card-title">{item.title}</div>
                        <div className="kanban-card-meta">
                          <span className={`tag tag--${item.level.toLowerCase()}`}>{item.level}</span>
                          <span>{statusLabel(item.status)}</span>
                          <span>{priorityLabel(item.priority)}</span>
                        </div>
                        <div className="kanban-card-bottom">
                          <span>{typeLabel(item.type)}</span>
                          <span>{item.assigneeId ? "已分配" : "未分配"}</span>
                        </div>
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
        description="先补标题和处理背景。创建后进入任务队列，再分配执行器。"
        onClose={() => setCreateOpen(false)}
        open={createOpen}
        title="创建任务"
        variant="side"
        footer={
          <>
            <button className="btn secondary" onClick={() => setCreateOpen(false)} type="button">
              取消
            </button>
            <button
              className="btn primary"
              disabled={!draft.title.trim()}
              onClick={() => {
                if (!draft.title.trim()) {
                  return;
                }
                props.onCreate?.({
                  title: draft.title.trim(),
                  description: draft.description.trim(),
                  type: draft.type,
                  priority: draft.priority,
                  level: draft.level,
                  status: draft.status,
                  dueAt: draft.dueAt.trim() || undefined
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
        <div className="dialog-form">
          <label className="dialog-field">
            <span>标题</span>
            <input
              onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))}
              className="dialog-input-control"
              value={draft.title}
            />
          </label>
          <label className="dialog-field">
            <span>描述</span>
            <textarea
              onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))}
              rows={4}
              className="dialog-input-control dialog-input-control--textarea"
              value={draft.description}
            />
          </label>
          <div className="dialog-grid-2">
            <label className="dialog-field">
              <span>类型</span>
              <select
                onChange={(event) => setDraft((value) => ({ ...value, type: event.target.value as TaskItem["type"] }))}
                className="dialog-input-control"
                value={draft.type}
              >
                {["event", "action", "system", "plugin"].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="dialog-field">
              <span>优先级</span>
              <select
                onChange={(event) => setDraft((value) => ({ ...value, priority: event.target.value as TaskItem["priority"] }))}
                className="dialog-input-control"
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
          <div className="dialog-grid-2">
            <label className="dialog-field">
              <span>注意力级别</span>
              <select
                onChange={(event) => setDraft((value) => ({ ...value, level: event.target.value as AttentionLevel }))}
                className="dialog-input-control"
                value={draft.level}
              >
                {["L3", "L2", "L1", "L0"].map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
            <label className="dialog-field">
              <span>初始状态</span>
              <select
                onChange={(event) => setDraft((value) => ({ ...value, status: event.target.value as TaskStatus }))}
                className="dialog-input-control"
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
          <label className="dialog-field">
            <span>截止时间</span>
            <input
              onChange={(event) => setDraft((value) => ({ ...value, dueAt: event.target.value }))}
              placeholder="可选"
              className="dialog-input-control"
              value={draft.dueAt}
            />
          </label>
        </div>
      </Dialog>
    </div>
  );

  function resetDraft() {
    setDraft({
      title: "",
      description: "",
      type: "action",
      priority: "medium",
      level: "L2",
      status: "pending_assignment",
      dueAt: ""
    });
  }
}

function statusLabel(status: TaskStatus) {
  switch (status) {
    case "pending_assignment":
      return "待分配";
    case "assigned":
      return "已分配";
    case "in_progress":
      return "进行中";
    case "pending_review":
      return "待审核";
    case "completed":
      return "已完成";
    case "suspended":
      return "已挂起";
    case "escalated":
      return "已升级";
    case "returned":
      return "已退回";
  }
}

function priorityLabel(priority: TaskItem["priority"]) {
  switch (priority) {
    case "urgent":
      return "紧急";
    case "high":
      return "高";
    case "medium":
      return "中";
    case "low":
      return "低";
  }
}

function typeLabel(type: TaskItem["type"]) {
  switch (type) {
    case "action":
      return "动作";
    case "event":
      return "事件";
    case "plugin":
      return "插件";
    case "system":
      return "系统";
  }
}
