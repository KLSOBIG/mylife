import type { TaskDetail } from "../../lib/types";
import { GanttTab } from "./gantt-tab";
import { ReminderEditor } from "./reminder-editor";

export function TaskDetailPane({
  task,
  activeTab = "details"
}: {
  task: TaskDetail;
  activeTab?: "details" | "gantt";
}) {
  return (
    <section>
      <div className="detail-tabs">
        <button type="button" className={activeTab === "details" ? "is-active" : ""}>
          任务详情
        </button>
        <button type="button" className={activeTab === "gantt" ? "is-active" : ""}>
          甘特图
        </button>
      </div>
      {activeTab === "details" ? (
        <>
          <h2>任务详情</h2>
          <h3>{task.title}</h3>
          <article className="detail-document">{task.document}</article>
          <section>
            <h3>提醒设置</h3>
            <ReminderEditor reminder={task.reminder} />
          </section>
          <section className="detail-checklist">
            {task.checklist.map((item) => (
              <div key={item.id}>{item.title}</div>
            ))}
          </section>
        </>
      ) : (
        <GanttTab task={task.timeline ?? { rows: [] }} />
      )}
    </section>
  );
}
