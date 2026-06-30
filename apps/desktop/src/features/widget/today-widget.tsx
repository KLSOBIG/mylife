import type { WidgetTask } from "../../lib/types";

export function TodayWidget({ tasks }: { tasks: WidgetTask[] }) {
  return (
    <section className="today-widget">
      <h2>今天进行中</h2>
      <div className="today-widget__list">
        {tasks.map((task) => (
          <article key={task.id} className="today-widget__card">
            <h3>{task.title}</h3>
            <div className="today-widget__actions">
              <button type="button">完成</button>
              <button type="button">下一状态</button>
              <button type="button">详情</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
