import { useRef } from "react";

export function TaskInlineCreator({
  value,
  onChange,
  onSave,
  onDiscard
}: {
  value: string;
  onChange?: (value: string) => void;
  onSave?: () => void;
  onDiscard?: () => void;
}) {
  const handledRef = useRef(false);

  function commit() {
    if (handledRef.current) {
      return;
    }

    handledRef.current = true;
    if (value.trim()) {
      onSave?.();
      return;
    }

    onDiscard?.();
  }

  function discard() {
    if (handledRef.current) {
      return;
    }

    handledRef.current = true;
    onDiscard?.();
  }

  return (
    <div
      className="task-inline-creator"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        border: "1px dashed #cdbda4",
        borderRadius: 14,
        background: "#fffcf6"
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#8f7656"
        }}
      >
        Auto
      </span>
      <input
        autoFocus
        placeholder="输入任务标题"
        value={value}
        onChange={(event) => {
          handledRef.current = false;
          onChange?.(event.target.value);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            discard();
          }
        }}
        style={{
          flex: 1,
          border: 0,
          outline: "none",
          fontSize: 14,
          background: "transparent",
          color: "#2f2a24"
        }}
      />
    </div>
  );
}
