import type { EventItem, ExecutorItem, Workspace } from "../../domain/types";

export function DashboardPage(props: {
  workspace: Workspace;
  events: EventItem[];
  executors: ExecutorItem[];
  chartSeries: number[];
  executionStats: {
    running: number;
    succeeded: number;
    failed: number;
  };
}) {
  const l3Count = props.events.filter((item) => item.level === "L3").length;
  const inFlight = props.executionStats.running;
  const failureCount = props.executionStats.failed;
  const sourceBuckets = Array.from(
    props.events.reduce((map, item) => {
      map.set(item.source, (map.get(item.source) ?? 0) + 1);
      return map;
    }, new Map<string, number>())
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);

  return (
    <div className="page-scroll">
      <section className="stats-row">
        <article className="stat-card">
          <div className="stat-label">📥 今日接收</div>
          <span className="sr-only">今日接收事件数</span>
          <div className="stat-value">{props.events.length}</div>
          <div className="stat-change stat-change--muted">条信息</div>
        </article>
        <article className="stat-card danger">
          <div className="stat-label">🔴 必须你</div>
          <div className="stat-value">{l3Count}</div>
          <div className="stat-change">L3 · 需要你处理</div>
        </article>
        <article className="stat-card warning">
          <div className="stat-label">🟡 Agent 处理中</div>
          <div className="stat-value">{inFlight}</div>
          <div className="stat-change">L2 · 自动处理</div>
        </article>
        <article className="stat-card success">
          <div className="stat-label">🟢 AI 已完成</div>
          <div className="stat-value">{props.executionStats.succeeded}</div>
          <div className="stat-change">L1/L2 · 已处理</div>
        </article>
      </section>

      <article className="card card-hero">
        <div className="card-header">
          <h3>🛡️ AI 注意力隔离</h3>
          <span>{props.workspace.name}</span>
        </div>
        <div className="card-body">
          <div className="hero-grid">
            <div className="hero-stat">
              <strong>{props.events.filter((item) => item.level === "L0").length}</strong>
              <span>L0 已隔离</span>
              <small>营销 / 噪音 / 无关</small>
            </div>
            <div className="hero-stat">
              <strong>{props.events.filter((item) => item.level === "L1").length}</strong>
              <span>L1 已追踪</span>
              <small>有结果再汇报</small>
            </div>
            <div className="hero-stat">
              <strong>{props.events.filter((item) => item.level === "L2").length}</strong>
              <span>L2 Agent 处理</span>
              <small>自动处理中</small>
            </div>
            <div className="hero-stat">
              <strong>{l3Count}</strong>
              <span>L3 必须你</span>
              <small>需要你关注</small>
            </div>
          </div>
          <div className="hero-foot">✅ 今日为你节省约 {Math.max(1, Math.round(props.events.length / 12))} 小时注意力</div>
        </div>
      </article>

      <section className="dashboard-grid">
        <article className="card">
          <div className="card-header">
            <h3>📈 事件趋势</h3>
            <span>查看详情</span>
          </div>
          <div className="card-body">
            <div className="chart-area">
              {props.chartSeries.map((value, index) => (
                <div key={index} className="chart-bar" style={{ height: `${value + 24}px` }} />
              ))}
            </div>
          </div>
        </article>

        <div className="dashboard-side">
          <article className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h3>🤖 执行器状态</h3>
              <span>{props.executors.length} 个</span>
            </div>
            <div className="card-body">
              <div className="stack-list">
                {props.executors.map((item) => (
                  <div key={item.id} className="agent-item">
                    <span className="agent-avatar">{item.avatar}</span>
                    <div className="agent-info">
                      <div className="agent-name">{item.name}</div>
                      <div className="agent-status">
                        <span className={`status-dot ${item.status}`} />
                        {item.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
          <article className="card">
            <div className="card-header">
              <h3>📊 来源分布</h3>
            </div>
            <div className="card-body">
              <div className="source-bars">
                {sourceBuckets.map(([source, count]) => (
                  <div className="source-bar-row" key={source}>
                    <span>{source}</span>
                    <div className="source-bar-track">
                      <div className="source-bar-fill" style={{ width: `${Math.max(16, (count / props.events.length) * 100)}%` }} />
                    </div>
                    <small>{Math.round((count / props.events.length) * 100)}%</small>
                  </div>
                ))}
              </div>
              <div className="execution-failure-note">执行失败 {failureCount} 次</div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
