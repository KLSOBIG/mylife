import { useMemo, useState } from "react";
import type { Workspace } from "../../domain/types";
import { Dialog } from "../common/dialog";
import { EmptyState } from "../common/empty-state";

type WorkspaceDraft = {
  name: string;
  kind: Workspace["kind"];
  description: string;
  icon: string;
};

export function WorkspaceSwitcher(props: {
  currentWorkspaceId: string;
  workspaces: Workspace[];
  onSwitch: (workspaceId: string) => void;
  onCreateWorkspace?: (draft: { name: string; kind: Workspace["kind"]; description: string; icon: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<WorkspaceDraft>({
    name: "",
    kind: "personal",
    description: "",
    icon: "N"
  });
  const current = useMemo(() => {
    return props.workspaces.find((item) => item.id === props.currentWorkspaceId) ?? props.workspaces[0];
  }, [props.currentWorkspaceId, props.workspaces]);
  const currentLabel = current ?? {
    id: "",
    name: "没有工作空间",
    description: "先创建首个工作空间",
    icon: "N"
  };

  return (
    <div className="workspace-switcher">
      <button
        aria-expanded={open}
        aria-label={`${currentLabel.name} 工作空间切换`}
        className="workspace-btn"
        onClick={() => {
          if (current) {
            setOpen((value) => !value);
          } else {
            setCreateOpen(true);
          }
        }}
        type="button"
      >
        <span className="workspace-icon workspace-icon--current">{currentLabel.icon}</span>
        <span className="workspace-info">
          <span className="workspace-name">{currentLabel.name}</span>
          <span className="workspace-type">{currentLabel.description}</span>
        </span>
        <span className="workspace-arrow">{current ? (open ? "▲" : "▼") : "+"}</span>
      </button>
      {!current ? <EmptyState description="先创建首个工作空间。" title="没有工作空间" /> : null}
      {open && current ? (
        <div className="workspace-dropdown">
          {props.workspaces.map((item) => (
            <button
              className={item.id === current.id ? "workspace-dropdown-item active" : "workspace-dropdown-item"}
              key={item.id}
              onClick={() => {
                props.onSwitch(item.id);
                setOpen(false);
              }}
              type="button"
            >
              <span className="ws-icon">{item.icon}</span>
              <span className="ws-info">
                <span className="ws-name">{item.name}</span>
                <span className="ws-desc">{item.description}</span>
              </span>
              <span className="ws-check">{item.id === current.id ? "✓" : ""}</span>
            </button>
          ))}
          <div className="workspace-divider" />
          <button aria-label="新建工作空间" className="workspace-add" onClick={() => setCreateOpen(true)} type="button">
            <span>+</span>
            <span>新建工作空间</span>
          </button>
        </div>
      ) : null}
      <Dialog
        description="创建后由主线程接管写入。"
        onClose={() => setCreateOpen(false)}
        open={createOpen}
        title="创建工作空间"
        footer={
          <>
            <button className="btn secondary" onClick={() => setCreateOpen(false)} type="button">
              取消
            </button>
            <button
              className="btn primary"
              aria-label="创建工作空间"
              onClick={() => {
                props.onCreateWorkspace?.({
                  name: draft.name.trim(),
                  kind: draft.kind,
                  description: draft.description.trim(),
                  icon: draft.icon.trim() || "N"
                });
                setDraft({ name: "", kind: "personal", description: "", icon: "N" });
                setCreateOpen(false);
              }}
              type="button"
            >
              创建工作空间
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
            <span>工作空间名称</span>
            <input
              onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))}
              style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
              value={draft.name}
            />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
              <span>工作空间类型</span>
              <select
                onChange={(event) => setDraft((value) => ({ ...value, kind: event.target.value as Workspace["kind"] }))}
                style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
                value={draft.kind}
              >
                {["personal", "team", "study", "life"].map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
              <span>图标</span>
              <input
                onChange={(event) => setDraft((value) => ({ ...value, icon: event.target.value }))}
                style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
                value={draft.icon}
              />
            </label>
          </div>
          <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
            <span>工作空间描述</span>
            <textarea
              onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))}
              rows={4}
              style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px", resize: "vertical" }}
              value={draft.description}
            />
          </label>
        </div>
      </Dialog>
    </div>
  );
}
