import type { SourceItem } from "../../domain/types";

export function SourcesPage(props: { sources: SourceItem[] }) {
  return (
    <div className="card-grid page-scroll">
      {props.sources.map((item) => (
        <article key={item.id} className="entity-card">
          <div className="entity-header">
            <div className="entity-avatar">{item.icon}</div>
            <div>
              <h3>{item.name}</h3>
              <p>{item.kind}</p>
            </div>
            <span className={`status-tag ${item.status}`}>{item.status}</span>
          </div>
          <p className="entity-description">{item.description}</p>
          <div className="entity-stat-line">{item.stat}</div>
        </article>
      ))}
    </div>
  );
}
