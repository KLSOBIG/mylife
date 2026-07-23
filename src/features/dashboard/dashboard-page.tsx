import type { EventItem, ExecutorItem, Workspace } from "../../domain/types";

export function DashboardPage(props: {
  workspace: Workspace;
  events: EventItem[];
  executors: ExecutorItem[];
  chartSeries: number[];
}) {
  const l3Count = props.events.filter((item) => item.level === "L3").length;
  const inFlight = props.executors.reduce((sum, item) => sum + item.activeTasks, 0);

  return (
    <div className="page-scroll">
      <section className="stats-row">
        <article className="stat-card">
          <span>今日接收事件数</span>
          <strong>{props.events.length}</strong>
        </article>
        <article className="stat-card danger">
          <span>L3 必须你</span>
          <strong>{l3Count}</strong>
        </article>
        <article className="stat-card warning">
          <span>Agent 处理中</span>
          <strong>{inFlight}</strong>
        </article>
        <article className="stat-card success">
          <span>AI 已完成</span>
          <strong>{Math.max(8, props.events.length * 2)}</strong>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="card">
          <div className="card-header">
            <h3>事件趋势</h3>
            <span>{props.workspace.name}</span>
          </div>
          <div className="chart">
            {props.chartSeries.map((value, index) => (
              <div key={index} className="chart-bar" style={{ height: `${value + 24}px` }} />
            ))}
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <h3>执行器状态</h3>
            <span>{props.executors.length} 个</span>
          </div>
          <div className="stack-list">
            {props.executors.map((item) => (
              <div key={item.id} className="executor-mini">
                <span className="executor-avatar">{item.avatar}</span>
                <div>
                  <strong>{item.name}</strong>
                  <p>
                    {item.role} / {item.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
