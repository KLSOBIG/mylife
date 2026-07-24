import type { EventItem, ExecutorItem, PageId, Workspace } from "../../domain/types";

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
  onNavigatePage?: (page: PageId) => void;
  onOpenEvent?: (eventId: string) => void;
}) {
  const l3Count = props.events.filter((item) => item.level === "L3").length;
  const inFlight = props.executionStats.running;
  const failureCount = props.executionStats.failed;
  const recentEvents = [...props.events]
    .sort((left, right) => right.happenedAt.localeCompare(left.happenedAt))
    .slice(0, 4);
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
        <article className="stat-card stat-card--animated" style={{ animationDelay: "0ms" }}>
          <div className="stat-label">📥 今日接收</div>
          <span className="sr-only">今日接收事件数</span>
          <div className="stat-value">{props.events.length}</div>
          <div className="stat-change stat-change--muted">条信息</div>
        </article>
        <article className="stat-card danger stat-card--animated" style={{ animationDelay: "50ms" }}>
          <div className="stat-label">🔴 必须你</div>
          <div className="stat-value">{l3Count}</div>
          <div className="stat-change">L3 · 需要你处理</div>
        </article>
        <article className="stat-card warning stat-card--animated" style={{ animationDelay: "100ms" }}>
          <div className="stat-label">🟡 Agent 处理中</div>
          <div className="stat-value">{inFlight}</div>
          <div className="stat-change">L2 · 自动处理</div>
        </article>
        <article className="stat-card success stat-card--animated" style={{ animationDelay: "150ms" }}>
          <div className="stat-label">🟢 AI 已完成</div>
          <div className="stat-value">{props.executionStats.succeeded}</div>
          <div className="stat-change">L1/L2 · 已处理</div>
        </article>
      </section>

      <article className="card card-hero stat-card--animated" style={{ animationDelay: "180ms" }}>
        <div className="card-header">
          <h3>🛡️ AI 注意力隔离</h3>
          <button className="card-action" onClick={() => props.onNavigatePage?.("events")} type="button">
            查看详情
          </button>
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
            <button className="card-action" onClick={() => props.onNavigatePage?.("events")} type="button">
              查看详情
            </button>
          </div>
          <div className="card-body">
            <div className="chart-area">
              {props.chartSeries.map((value, index) => (
                <div
                  key={index}
                  className="chart-bar chart-bar--animated"
                  style={{ height: `${value + 24}px`, animationDelay: `${120 + index * 40}ms` }}
                />
              ))}
            </div>
          </div>
        </article>

        <div className="dashboard-side">
          <article className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h3>🕐 最近事件</h3>
              <button className="card-action" onClick={() => props.onNavigatePage?.("events")} type="button">
                查看全部
              </button>
            </div>
            <div className="card-body">
              {recentEvents.length ? (
                recentEvents.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className="event-mini event-mini--animated"
                    style={{ animationDelay: `${index * 40}ms` }}
                    onClick={() => props.onOpenEvent?.(item.id)}
                  >
                    <span className={`event-mini-icon event-mini-icon--${item.level.toLowerCase()}`}>{eventGlyph(item.source)}</span>
                    <span className="event-mini-content">
                      <span className="event-mini-title">{item.title}</span>
                      <span className="event-mini-meta">
                        {item.source} · {item.sender}
                      </span>
                    </span>
                    <span className="event-mini-time">{relativeLabel(item.happenedAt)}</span>
                  </button>
                ))
              ) : (
                <div className="event-mini-empty">最近还没有事件。</div>
              )}
            </div>
          </article>
          <article className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h3>🤖 执行器状态</h3>
              <button className="card-action" onClick={() => props.onNavigatePage?.("executors")} type="button">
                管理
              </button>
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

function eventGlyph(source: string) {
  if (source.includes("钉钉")) return "💬";
  if (source.includes("邮件")) return "📧";
  if (source.includes("RSS") || source.includes("ArXiv")) return "📰";
  return "📌";
}

function relativeLabel(happenedAt: string) {
  const time = new Date(happenedAt.replace(" ", "T"));
  if (Number.isNaN(time.getTime())) {
    return happenedAt;
  }
  const minutes = Math.max(1, Math.round((Date.now() - time.getTime()) / 60000));
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}小时前`;
  }
  const days = Math.round(hours / 24);
  return `${days}天前`;
}
