import type { ExecutorItem } from "../../domain/types";

export function ExecutorsPage(props: { executors: ExecutorItem[] }) {
  return (
    <div className="card-grid page-scroll">
      {props.executors.map((item) => (
        <article key={item.id} className="entity-card">
          <div className="entity-header">
            <div className="entity-avatar">{item.avatar}</div>
            <div>
              <h3>{item.name}</h3>
              <p>{item.role}</p>
            </div>
            <span className={`status-tag ${item.status}`}>{item.status}</span>
          </div>
          <div className="capability-list">
            {item.capabilities.map((capability) => (
              <span key={capability}>{capability}</span>
            ))}
          </div>
          <div className="metric-row">
            <div>
              <strong>{item.activeTasks}</strong>
              <span>执行中</span>
            </div>
            <div>
              <strong>{item.completedToday}</strong>
              <span>今日完成</span>
            </div>
            <div>
              <strong>{item.successRate}%</strong>
              <span>成功率</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
