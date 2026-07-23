import type { TaskItem } from "../../domain/types";

export function TaskDetail(props: { task: TaskItem }) {
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
    </div>
  );
}
