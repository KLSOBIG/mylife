import type { TaskDetail } from "../../lib/types";
import { ReminderEditor } from "./reminder-editor";

export function TaskDetailPane({ task }: { task: TaskDetail }) {
  return (
    <section>
      <h2>任务详情</h2>
      <h3>{task.title}</h3>
      <article>{task.document}</article>
      <section>
        <h3>提醒设置</h3>
        <ReminderEditor reminder={task.reminder} />
      </section>
      <section>
        {task.checklist.map((item) => (
          <div key={item.id}>{item.title}</div>
        ))}
      </section>
    </section>
  );
}
