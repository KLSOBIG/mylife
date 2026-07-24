import type { PluginSummary } from "../../domain/types";
import { EmptyState } from "../common/empty-state";

function healthLabel(plugin: PluginSummary) {
  if (!plugin.health) {
    return "unknown";
  }
  return plugin.health.status;
}

export function PluginsPage(props: {
  sources: PluginSummary[];
  executors: PluginSummary[];
  rules: PluginSummary[];
}) {
  return (
    <div className="page-scroll stack-list">
      <section className="plugin-section">
        <div className="plugin-section__header">
          <h2>插件</h2>
          <p>真实接入、健康状态、错误上下文都收在这里。</p>
        </div>
      </section>

      <PluginGroup title="信息源" items={props.sources} empty="当前工作空间没有信息源插件。" />
      <PluginGroup title="执行器" items={props.executors} empty="当前工作空间没有执行器插件。" />
      <PluginGroup title="规则" items={props.rules} empty="当前工作空间没有规则插件。" />
    </div>
  );
}

function PluginGroup(props: { title: string; items: PluginSummary[]; empty: string }) {
  return (
    <section className="plugin-section">
      <div className="plugin-section__header">
        <h3>{props.title}</h3>
        <span>{props.items.length} 个</span>
      </div>
      {props.items.length ? (
        <div className="card-grid">
          {props.items.map((item) => (
            <article key={item.id} className="entity-card plugin-card">
              <div className="entity-header">
                <div className="entity-avatar">{item.name.slice(0, 1)}</div>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.type ?? item.kind}</p>
                </div>
                <span className={`status-tag ${healthClassName(item)}`}>{healthLabel(item)}</span>
              </div>
              <div className="plugin-card__meta">
                <span>类型：{item.type ?? item.kind}</span>
                <span>适配器：{item.adapterKind ?? item.kind}</span>
                <span>工作空间：{item.workspaceName ?? item.workspaceId}</span>
                <span>{item.enabled ? "已启用" : "已停用"}</span>
              </div>
              <div className="plugin-card__meta plugin-card__meta--bottom">
                {item.lastSyncAt ? <span>最近同步：{item.lastSyncAt}</span> : null}
                {item.lastResult ? <span>最近结果：{item.lastResult}</span> : null}
              </div>
              {item.health?.message ? <p className="plugin-card__message">{item.health.message}</p> : null}
              {item.lastError ? <p className="plugin-card__error">{item.lastError}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="暂无插件" description={props.empty} />
      )}
    </section>
  );
}

function healthClassName(plugin: PluginSummary) {
  if (!plugin.health) {
    return "warning";
  }
  return plugin.health.status === "ok" ? "connected" : plugin.health.status;
}
