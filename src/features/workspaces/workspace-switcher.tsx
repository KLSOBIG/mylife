import { useState } from "react";
import type { Workspace } from "../../domain/types";

export function WorkspaceSwitcher(props: {
  currentWorkspaceId: string;
  workspaces: Workspace[];
  onSwitch: (workspaceId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = props.workspaces.find((item) => item.id === props.currentWorkspaceId) ?? props.workspaces[0];

  return (
    <div className="workspace-switcher">
      <button
        type="button"
        className="workspace-button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`${current.name} 工作空间切换`}
      >
        <span className="workspace-icon">{current.icon}</span>
        <span className="workspace-meta">
          <strong>{current.name}</strong>
          <small>{current.description}</small>
        </span>
        <span className="workspace-caret">{open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <div className="workspace-menu">
          {props.workspaces.map((item) => (
            <button
              type="button"
              key={item.id}
              className={item.id === current.id ? "workspace-option active" : "workspace-option"}
              onClick={() => {
                props.onSwitch(item.id);
                setOpen(false);
              }}
            >
              <span className="workspace-icon">{item.icon}</span>
              <span className="workspace-meta">
                <strong>{item.name}</strong>
                <small>{item.description}</small>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
