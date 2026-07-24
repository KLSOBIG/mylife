import { type ReactNode, useId } from "react";

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "modal" | "side";
};

export function Dialog(props: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const variant = props.variant ?? "modal";

  if (!props.open) {
    return null;
  }

  return (
    <div className={variant === "side" ? "dialog-overlay dialog-overlay--side show" : "dialog-overlay show"} onClick={props.onClose}>
      <div
        aria-describedby={props.description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={variant === "side" ? "dialog-panel dialog-panel--side" : "dialog-panel"}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="dialog-panel__header">
          <div>
            <h3 id={titleId} className="dialog-panel__title">
              {props.title}
            </h3>
            {props.description ? (
              <p id={descriptionId} className="dialog-panel__description">
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

        <div className="dialog-panel__body">{props.children}</div>

        {props.footer ? (
          <div className="dialog-panel__footer">{props.footer}</div>
        ) : null}
      </div>
    </div>
  );
}
