import type { ExecutionRun, ExecutorItem, TaskItem } from "../../domain/types";

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
  runs?: ExecutionRun[];
  activeRun?: ExecutionRun;
  hasExternalExecutor?: boolean;
  onStatusChange?: (nextStatus: TaskItem["status"]) => void;
  onAssigneeChange?: (assigneeId?: string) => void;
  onStartExecution?: () => void;
  onStartExternalExecution?: () => void;
  onMarkExecutionSuccess?: () => void;
  onMarkExecutionFailure?: () => void;
  onRetryExecution?: () => void;
}) {
  const nextStatuses = statusFlow[props.task.status];
  const latestRun = props.activeRun ?? props.runs?.[0];
  const logs = latestRun?.logs ?? [];
  const canStart = props.task.assigneeId && !props.activeRun && (props.task.status === "assigned" || props.task.status === "returned" || props.task.status === "suspended");
  const canResolve = props.activeRun?.status === "running";
  const canRetry = latestRun?.status === "failed" && !props.activeRun;
  const runStatusLabel = latestRun?.status ?? "idle";
  const runResult = latestRun?.summary ?? latestRun?.error;

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
        <h3>执行运行</h3>
        <div className="execution-summary">
          <span className={`execution-state ${runStatusLabel}`}>运行状态：{runStatusLabel}</span>
          <span className="execution-meta">开始 {latestRun?.startedAt ?? "未开始"}</span>
          <span className="execution-meta">结束 {latestRun?.finishedAt ?? "未结束"}</span>
          {runResult ? <span className="execution-result">{runResult}</span> : null}
        </div>
        <div className="execution-actions">
          {canStart ? (
            <>
              <button className="btn primary small" onClick={props.onStartExecution} type="button">
                开始执行
              </button>
              {props.hasExternalExecutor ? (
                <button className="btn secondary small" onClick={props.onStartExternalExecution} type="button">
                  真实执行
                </button>
              ) : null}
            </>
          ) : null}
          {canResolve ? (
            <>
              <button className="btn secondary small" onClick={props.onMarkExecutionSuccess} type="button">
                标记成功
              </button>
              <button className="btn secondary small" onClick={props.onMarkExecutionFailure} type="button">
                标记失败
              </button>
            </>
          ) : null}
          {canRetry ? (
            <button className="btn secondary small" onClick={props.onRetryExecution} type="button">
              重试执行
            </button>
          ) : null}
        </div>
        <div className="execution-log">
          {logs.length ? (
            logs.map((entry) => (
              <article className={`execution-log-entry ${entry.level}`} key={entry.id}>
                <div className="execution-log-top">
                  <span>{entry.at}</span>
                  <span>{entry.level}</span>
                </div>
                <p>{entry.message}</p>
              </article>
            ))
          ) : (
            <div className="execution-log-empty">暂无运行日志。</div>
          )}
        </div>
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
