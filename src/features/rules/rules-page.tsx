import type { RuleItem } from "../../domain/types";

export function RulesPage(props: { rules: RuleItem[] }) {
  return (
    <div className="page-scroll stack-list">
      {props.rules.map((item) => (
        <article key={item.id} className="rule-card">
          <div className="rule-header">
            <div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </div>
            <span className={item.enabled ? "toggle on" : "toggle"}>{item.enabled ? "启用" : "停用"}</span>
          </div>
          <code>{item.condition}</code>
          <code className="rule-action">{item.action}</code>
          <div className="rule-meta">
            <span>{item.level}</span>
            <span>触发 {item.triggeredCount}</span>
            <span>成功率 {item.successRate}%</span>
          </div>
        </article>
      ))}
    </div>
  );
}
