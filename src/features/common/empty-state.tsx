import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  children?: ReactNode;
};

export function EmptyState(props: EmptyStateProps) {
  return (
    <div
      style={{
        display: "grid",
        gap: 14,
        justifyItems: "start",
        padding: 24,
        border: "1px dashed var(--border)",
        borderRadius: 18,
        background: "#fff"
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <strong style={{ fontSize: 15 }}>{props.title}</strong>
        {props.description ? (
          <p style={{ margin: 0, color: "var(--text-body)", fontSize: 12, lineHeight: 1.6 }}>{props.description}</p>
        ) : null}
      </div>
      {props.children}
      {(props.actionLabel || props.secondaryActionLabel) ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {props.actionLabel ? (
            <button className="btn primary" onClick={props.onAction} type="button">
              {props.actionLabel}
            </button>
          ) : null}
          {props.secondaryActionLabel ? (
            <button className="btn secondary" onClick={props.onSecondaryAction} type="button">
              {props.secondaryActionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
