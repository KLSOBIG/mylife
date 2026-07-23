import { type ReactNode, useId } from "react";

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function Dialog(props: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  if (!props.open) {
    return null;
  }

  return (
    <div
      onClick={props.onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "rgba(15, 23, 42, 0.45)"
      }}
    >
      <div
        aria-describedby={props.description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        style={{
          width: "min(640px, 100%)",
          maxHeight: "min(88vh, 860px)",
          overflow: "auto",
          borderRadius: 20,
          border: "1px solid var(--border)",
          background: "#fff",
          boxShadow: "var(--shadow)"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            padding: "18px 20px",
            borderBottom: "1px solid var(--border)"
          }}
        >
          <div>
            <h3 id={titleId} style={{ margin: 0, fontSize: 16 }}>
              {props.title}
            </h3>
            {props.description ? (
              <p id={descriptionId} style={{ margin: "6px 0 0", color: "var(--text-body)", fontSize: 12, lineHeight: 1.5 }}>
                {props.description}
              </p>
            ) : null}
          </div>
          <button
            aria-label="关闭"
            className="btn secondary"
            onClick={props.onClose}
            type="button"
          >
            关闭
          </button>
        </div>

        <div style={{ padding: 20 }}>{props.children}</div>

        {props.footer ? (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              padding: "0 20px 20px"
            }}
          >
            {props.footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
