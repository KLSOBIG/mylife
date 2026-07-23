import type { EventItem } from "../../domain/types";

export function EventDetail(props: { event: EventItem }) {
  return (
    <div className="detail-section-stack">
      <div className="detail-badge">{props.event.level} 事件</div>
      <h2 className="detail-title">{props.event.title}</h2>
      <section className="detail-section">
        <h3>摘要</h3>
        <p>{props.event.summary}</p>
      </section>
      <section className="detail-section">
        <h3>元信息</h3>
        <ul className="detail-list">
          <li>来源：{props.event.source}</li>
          <li>发送人：{props.event.sender}</li>
          <li>发生时间：{props.event.happenedAt}</li>
          <li>标签：{props.event.tags.join(" / ")}</li>
        </ul>
      </section>
    </div>
  );
}
