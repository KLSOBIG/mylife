import type { ExecutorItem } from "../../domain/types";

export function ExecutorsPage(props: {
  executors: ExecutorItem[];
}) {
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
              <strong>{item.queueCount ?? 0}</strong>
              <span>队列中</span>
            </div>
            <div>
              <strong>{item.runningCount ?? item.activeTasks}</strong>
              <span>运行中</span>
            </div>
            <div>
              <strong>{item.completedToday}</strong>
              <span>今日完成</span>
            </div>
            <div>
              <strong>{item.failureCount ?? 0}</strong>
              <span>失败次数</span>
            </div>
            <div>
              <span className={`recent-result ${(item.failureCount ?? 0) > 0 ? "error" : item.runningCount ? "running" : "idle"}`}>
                {item.lastRunSummary ?? item.status}
              </span>
              <span>最近结果</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
