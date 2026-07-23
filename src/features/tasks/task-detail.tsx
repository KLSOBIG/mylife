import type { ExecutorItem, TaskItem } from "../../domain/types";

const statusFlow: Record<TaskItem["status"], TaskItem["status"][]> = {
  pending_assignment: ["assigned"],
  assigned: ["in_progress", "returned"],
  in_progress: ["pending_review", "suspended"],
  pending_review: ["completed", "returned"],
  completed: [],
  suspended: ["in_progress"],
  escalated: ["pending_review"],
  returned: ["assigned"]
};

export function TaskDetail(props: {
  task: TaskItem;
  executors?: ExecutorItem[];
  onStatusChange?: (nextStatus: TaskItem["status"]) => void;
  onAssigneeChange?: (assigneeId?: string) => void;
}) {
  const nextStatuses = statusFlow[props.task.status];

  return (
    <div className="detail-section-stack">
      <div className="detail-badge">任务详情</div>
      <h2 className="detail-title">{props.task.title}</h2>
      <section className="detail-section">
        <h3>描述</h3>
        <p>{props.task.description}</p>
      </section>
      <section className="detail-section">
        <h3>状态</h3>
        <ul className="detail-list">
          <li>状态：{props.task.status}</li>
          <li>优先级：{props.task.priority}</li>
          <li>注意力级别：{props.task.level}</li>
          <li>截止时间：{props.task.dueAt ?? "未设置"}</li>
        </ul>
      </section>
      <section className="detail-section">
        <h3>执行器</h3>
        <label className="field">
          <span>执行器</span>
          <select
            aria-label="执行器"
            className="input"
            onChange={(event) => props.onAssigneeChange?.(event.target.value || undefined)}
            value={props.task.assigneeId ?? ""}
          >
            <option value="">未分配</option>
            {(props.executors ?? []).map((executor) => (
              <option key={executor.id} value={executor.id}>
                {executor.name} · {executor.role}
              </option>
            ))}
          </select>
        </label>
      </section>
      <section className="detail-section">
        <h3>状态流转</h3>
        {nextStatuses.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {nextStatuses.map((nextStatus) => (
              <button
                className="btn secondary"
                key={nextStatus}
                onClick={() => props.onStatusChange?.(nextStatus)}
                type="button"
              >
                切换到 {nextStatus}
              </button>
            ))}
          </div>
        ) : (
          <p>当前状态已完成，没有下一步。</p>
        )}
      </section>
    </div>
  );
}
