import type { ChatMessage } from "../../domain/types";

export function ChatPanel(props: {
  open: boolean;
  pinned: boolean;
  messages: ChatMessage[];
  onTogglePinned: () => void;
}) {
  return (
    <aside className={props.open ? "chat-panel open" : "chat-panel"}>
      <div className="chat-header">
        <div>
          <strong>对话引擎</strong>
          <p>一个对话框搞定一切</p>
        </div>
        <button type="button" className="btn secondary small" onClick={props.onTogglePinned}>
          {props.pinned ? "已钉住" : "未钉住"}
        </button>
      </div>
      <div className="chat-body">
        {props.messages.map((message) => (
          <div key={message.id} className={message.role === "ai" ? "chat-bubble ai" : "chat-bubble user"}>
            {message.content}
          </div>
        ))}
      </div>
      <div className="chat-footer">
        <input type="text" placeholder="输入：创建一个紧急任务，处理客户投诉" aria-label="对话输入框" />
      </div>
    </aside>
  );
}
