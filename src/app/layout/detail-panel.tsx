import type { EventItem, TaskItem } from "../../domain/types";
import { EventDetail } from "../../features/events/event-detail";
import { TaskDetail } from "../../features/tasks/task-detail";

export function DetailPanel(props: {
  event?: EventItem;
  task?: TaskItem;
}) {
  return (
    <aside className={props.event || props.task ? "detail-panel open" : "detail-panel"}>
      <div className="detail-header">详情</div>
      <div className="detail-body">
        {props.event ? <EventDetail event={props.event} /> : null}
        {props.task ? <TaskDetail task={props.task} /> : null}
        {!props.event && !props.task ? <div className="detail-empty">点击事件或任务，右侧显示详情。</div> : null}
      </div>
    </aside>
  );
}
