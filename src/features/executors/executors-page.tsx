import type { ExecutorItem } from "../../domain/types";

export function ExecutorsPage(props: { executors: ExecutorItem[] }) {
  const agents = props.executors.filter((item) => item.type === "agent");
  const humans = props.executors.filter((item) => item.type === "human");
  const totalRunning = props.executors.reduce((sum, item) => sum + (item.runningCount ?? item.activeTasks ?? 0), 0);
  const totalCompleted = props.executors.reduce((sum, item) => sum + item.completedToday, 0);
  const totalFailures = props.executors.reduce((sum, item) => sum + (item.failureCount ?? 0), 0);

  return (
    <div className="page-scroll">
      <div className="page-topbar">
        <div>
          <h2 className="page-section-title">执行器管理</h2>
          <p className="page-section-subtitle">执行器负责具体执行，系统只负责驱动流程</p>
        </div>
        <button className="btn btn-p" type="button">
          + 添加执行器
        </button>
      </div>

      <div className="mini-stats-row">
        <div className="mini-stat-card">
          <div className="mini-stat-card__value mini-stat-card__value--green">{props.executors.length}</div>
          <div className="mini-stat-card__label">活跃执行器</div>
        </div>
        <div className="mini-stat-card">
          <div className="mini-stat-card__value mini-stat-card__value--yellow">{totalRunning}</div>
          <div className="mini-stat-card__label">执行中任务</div>
        </div>
        <div className="mini-stat-card">
          <div className="mini-stat-card__value mini-stat-card__value--accent">{totalCompleted}</div>
          <div className="mini-stat-card__label">今日完成</div>
        </div>
        <div className="mini-stat-card">
          <div className="mini-stat-card__value mini-stat-card__value--muted">{totalFailures}</div>
          <div className="mini-stat-card__label">异常/超时</div>
        </div>
      </div>

      <div className="flow-card">
        <div className="flow-card__title">执行流程</div>
        <div className="flow-steps">
          <span className="flow-step flow-step--accent">接收任务</span>
          <span>→</span>
          <span className="flow-step flow-step--yellow">能力匹配</span>
          <span>→</span>
          <span className="flow-step flow-step--green">执行任务</span>
          <span>→</span>
          <span className="flow-step flow-step--blue">提交结果</span>
          <span>→</span>
          <span className="flow-step flow-step--muted">完成/审核</span>
        </div>
      </div>

      <h3 className="subsection-title">Agent 执行器</h3>
      <div className="agents-grid agents-grid--compact">
        {agents.map((item) => {
          const latestResult = item.lastResult ?? item.lastRunSummary;
          return (
            <article key={item.id} className="agent-card entity-card">
              <div className="agent-card-hd">
                <div className="agent-card-avatar">{item.avatar}</div>
                <div className="agent-card-info">
                  <div className="agent-card-name">{item.name}</div>
                  <div className="agent-card-role">{item.role}</div>
                </div>
                <div className={`agent-card-status status-chip status-chip--${item.status}`}>● {statusText(item.status)}</div>
              </div>
              <div className="agent-caps capability-list">
                {item.capabilities.map((capability) => (
                  <span className="cap" key={capability}>
                    {capability}
                  </span>
                ))}
              </div>
              <div className="agent-metrics-grid">
                <Metric label="今日完成" value={item.completedToday} />
                <Metric label="队列中" value={item.queueCount ?? 0} />
                <Metric label="运行中" value={item.runningCount ?? item.activeTasks ?? 0} />
                <Metric label="失败次数" value={item.failureCount ?? 0} />
                <Metric label="成功率" value={`${item.successRate}%`} accent />
              </div>
              <div className="agent-card-actions">
                <button className="btn btn-sm" type="button">
                  配置
                </button>
                <button className="btn btn-sm" type="button">
                  暂停
                </button>
                <button className="btn btn-sm" type="button">
                  历史
                </button>
              </div>
              {latestResult ? <div className="agent-card-note">{latestResult}</div> : null}
            </article>
          );
        })}
      </div>

      {humans.length ? <h3 className="subsection-title">👤 人执行器</h3> : null}
      <div className="agents-grid agents-grid--compact">
        {humans.map((item) => (
          <article key={item.id} className="agent-card entity-card">
            <div className="agent-card-hd">
              <div className="agent-card-avatar">{item.avatar}</div>
              <div className="agent-card-info">
                <div className="agent-card-name">{item.name}</div>
                <div className="agent-card-role">{item.role}</div>
              </div>
              <div className={`agent-card-status status-chip status-chip--${item.status}`}>● {statusText(item.status)}</div>
            </div>
            <div className="agent-caps capability-list">
              {item.capabilities.map((capability) => (
                <span className="cap" key={capability}>
                  {capability}
                </span>
              ))}
            </div>
            <div className="agent-metrics-grid">
              <Metric label="待处理" value={item.activeTasks} />
              <Metric label="待审核" value={item.queueCount ?? 0} />
              <Metric label="今日完成" value={item.completedToday} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Metric(props: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="agent-metric">
      <div className={props.accent ? "agent-metric__value agent-metric__value--accent" : "agent-metric__value"}>{props.value}</div>
      <div className="agent-metric__label">{props.label}</div>
    </div>
  );
}

function statusText(status: ExecutorItem["status"]) {
  switch (status) {
    case "idle":
      return "空闲";
    case "busy":
      return "处理中";
    case "offline":
      return "离线";
    case "error":
      return "异常";
  }
}
