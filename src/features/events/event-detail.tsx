import type { EventItem } from "../../domain/types";

export function EventDetail(props: { event: EventItem; onConvertToTask?: () => void }) {
  return (
    <div className="detail-section-stack">
      <div className="detail-title">{props.event.title}</div>
      <div className="detail-section">
        <div className="detail-label">级别</div>
        <div className="detail-value">
          <select aria-label="事件级别" defaultValue={props.event.level}>
            <option value="L3">L3 必须你</option>
            <option value="L2">L2 Agent处理</option>
            <option value="L1">L1 可追踪</option>
            <option value="L0">L0 噪音</option>
          </select>
        </div>
      </div>
      <div className="detail-section">
        <div className="detail-label">来源</div>
        <div className="detail-value">{props.event.source} / {props.event.sender}</div>
      </div>
      <div className="detail-section">
        <div className="detail-label">内容</div>
        <div className="detail-desc">{props.event.summary}</div>
      </div>
      <div className="detail-divider" />
      <div className="thread">
        <div className="thread-hd">
          <h3>对话线程</h3>
          <span className="count">1轮</span>
        </div>
        <div className="comment">
          <div className="comment-avatar ai">✨</div>
          <div className="comment-body">
            <div className="comment-hd">
              <span className="comment-name">Nexus</span>
              <span className="comment-time">{props.event.happenedAt}</span>
            </div>
            <div className="comment-text">
              <p>{props.event.summary}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="detail-section">
        <button className="btn btn-p btn-sm" onClick={props.onConvertToTask} type="button">
          转为任务
        </button>
      </div>
    </div>
  );
}
