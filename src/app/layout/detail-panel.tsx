import type { EventItem, ExecutionRun, ExecutorItem, TaskItem } from "../../domain/types";
import { EventDetail } from "../../features/events/event-detail";
import { TaskDetail } from "../../features/tasks/task-detail";

export function DetailPanel(props: {
  event?: EventItem;
  task?: TaskItem;
  executors?: ExecutorItem[];
  runs?: ExecutionRun[];
  activeRun?: ExecutionRun;
  latestRun?: ExecutionRun;
  onTaskStatusChange?: (nextStatus: TaskItem["status"]) => void;
  onTaskAssigneeChange?: (assigneeId?: string) => void;
  onTaskExecutionStart?: () => void;
  onTaskExecutionSuccess?: () => void;
  onTaskExecutionFailure?: () => void;
  onTaskExecutionRetry?: () => void;
  onConvertEventToTask?: () => void;
}) {
  const hasDetail = Boolean(props.event || props.task);
  return (
    <aside className={hasDetail ? "detail-panel open" : "detail-panel"}>
      <div className="detail-header">
        <div>
          <div className="detail-kicker">当前焦点</div>
          <div className="detail-titlebar">详情</div>
        </div>
      </div>
      <div className="detail-body">
        {props.event ? (
          <div className="detail-section-stack">
            <div className="detail-surface">
              <EventDetail event={props.event} onConvertToTask={props.onConvertEventToTask} />
            </div>
          </div>
        ) : null}
        {props.task ? (
          <div className="detail-section-stack">
            <div className="detail-surface">
              <TaskDetail
                activeRun={props.activeRun}
                executors={props.executors}
                onAssigneeChange={props.onTaskAssigneeChange}
                onMarkExecutionFailure={props.onTaskExecutionFailure}
                onMarkExecutionSuccess={props.onTaskExecutionSuccess}
                onRetryExecution={props.onTaskExecutionRetry}
                onStartExecution={props.onTaskExecutionStart}
                onStatusChange={props.onTaskStatusChange}
                runs={props.runs}
                task={props.task}
              />
            </div>
          </div>
        ) : null}
        {!props.event && !props.task ? (
          <div className="detail-empty">
            <strong>等你选中内容。</strong>
            <p>点事件或任务，右侧出现上下文详情、状态和处理动作。</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
