import { useState } from "react";
import type { ChatMessage } from "../../domain/types";

export type ChatPanelMode = "side" | "modal";

export function ChatPanel(props: {
  open: boolean;
  pinned: boolean;
  messages: ChatMessage[];
  mode?: ChatPanelMode;
  onModeChange?: (mode: ChatPanelMode) => void;
  onSubmit?: (message: string) => void;
  onClose?: () => void;
  onTogglePinned: () => void;
}) {
  const mode = props.mode ?? "side";
  const [draft, setDraft] = useState("");
  const visible = props.open;

  const content = (
    <>
      <div className="chat-header">
        <div>
          <strong>对话引擎</strong>
          <p>一个对话框搞定一切</p>
        </div>
        <div className="chat-header-actions">
          <button
            type="button"
            className={mode === "side" ? "btn btn-sm active" : "btn btn-sm"}
            onClick={() => props.onModeChange?.("side")}
          >
            侧板
          </button>
          <button
            type="button"
            className={mode === "modal" ? "btn btn-sm active" : "btn btn-sm"}
            onClick={() => props.onModeChange?.("modal")}
          >
            弹窗
          </button>
          <button type="button" className="btn btn-sm" onClick={props.onTogglePinned}>
            {props.pinned ? "已钉住" : "未钉住"}
          </button>
          {mode === "modal" ? (
            <button
              type="button"
              className="btn btn-sm"
              onClick={props.onClose}
            >
              关闭
            </button>
          ) : null}
        </div>
      </div>
      <div className="chat-body">
        {props.messages.map((message) => (
          <div key={message.id} className={message.role === "ai" ? "chat-bubble ai" : "chat-bubble user"}>
            {message.content}
          </div>
        ))}
      </div>
      <form
        className="chat-footer"
        onSubmit={(event) => {
          event.preventDefault();
          const message = draft.trim();
          if (!message) {
            return;
          }
          props.onSubmit?.(message);
          setDraft("");
        }}
      >
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="输入：创建一个紧急任务，处理客户投诉"
          aria-label="对话输入框"
        />
        <button type="submit" className="btn btn-p btn-sm">
          发送
        </button>
      </form>
    </>
  );

  if (!visible) {
    return null;
  }

  if (mode === "modal") {
    return (
      <div className="chat-modal" role="dialog" aria-modal="true" aria-label="对话引擎">
        <button
          type="button"
          className="chat-modal-backdrop"
          aria-label="关闭对话"
          onClick={props.onClose}
        />
        <aside className="chat-panel chat-panel--modal open">{content}</aside>
      </div>
    );
  }

  return <aside className="chat-panel chat-panel--side open">{content}</aside>;
}
