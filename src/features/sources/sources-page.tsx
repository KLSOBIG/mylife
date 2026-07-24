import { useMemo, useState } from "react";
import type { SourceItem } from "../../domain/types";
import { Dialog } from "../common/dialog";
import { EmptyState } from "../common/empty-state";

type SourceDraft = {
  name: string;
  kind: SourceItem["kind"];
  status: SourceItem["status"];
  icon: string;
  description: string;
  stat: string;
};

export function SourcesPage(props: {
  sources: SourceItem[];
  realSourceIds?: string[];
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: "all" | SourceItem["status"];
  onStatusFilterChange?: (next: "all" | SourceItem["status"]) => void;
  onToggleSource?: (sourceId: string, nextStatus: SourceItem["status"]) => void;
  onSyncSource?: (sourceId: string) => void;
  onCreateSource?: (draft: {
    name: string;
    kind: SourceItem["kind"];
    status: SourceItem["status"];
    icon: string;
    description: string;
    stat: string;
  }) => void;
}) {
  const [searchDraft, setSearchDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<"all" | SourceItem["status"]>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<SourceDraft>({
    name: "",
    kind: "api",
    status: "connected",
    icon: "S",
    description: "",
    stat: ""
  });

  const searchValue = props.searchQuery ?? searchDraft;
  const activeStatusFilter = props.statusFilter ?? statusDraft;
  const visibleSources = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    return props.sources.filter((item) => {
      const matchesStatus = activeStatusFilter === "all" || item.status === activeStatusFilter;
      if (!matchesStatus) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return [item.name, item.kind, item.status, item.description, item.stat].join(" ").toLowerCase().includes(normalized);
    });
  }, [activeStatusFilter, props.sources, searchValue]);

  return (
    <div className="page-scroll stack-list">
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
          <input
            aria-label="搜索信息源"
            onChange={(event) => {
              const next = event.target.value;
              if (props.searchQuery === undefined) {
                setSearchDraft(next);
              }
              props.onSearchChange?.(next);
            }}
            placeholder="搜索名称、类型、状态、描述"
            style={{
              flex: "1 1 320px",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "11px 14px",
              outline: "none"
            }}
            value={searchValue}
          />
          <button className="btn primary" onClick={() => setCreateOpen(true)} type="button">
            添加信息源
          </button>
        </div>
        <div className="chips">
          {(["all", "connected", "warning", "offline"] as const).map((status) => (
            <button
              className={status === activeStatusFilter ? "chip active" : "chip"}
              key={status}
              onClick={() => {
                if (props.statusFilter === undefined) {
                  setStatusDraft(status);
                }
                props.onStatusFilterChange?.(status);
              }}
              type="button"
            >
              {status === "all" ? "全部" : status}
            </button>
          ))}
        </div>
      </div>

      {visibleSources.length ? (
        <div className="card-grid">
          {visibleSources.map((item) => (
            <article key={item.id} className="entity-card">
              <div className="entity-header">
                <div className="entity-avatar">{item.icon}</div>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.kind}</p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    className={`status-tag ${item.status}`}
                    onClick={() =>
                      props.onToggleSource?.(item.id, item.status === "connected" ? "offline" : "connected")
                    }
                    type="button"
                  >
                    {item.status}
                  </button>
                  {props.realSourceIds?.includes(item.id) ? (
                    <button className="btn secondary small" onClick={() => props.onSyncSource?.(item.id)} type="button">
                      真实同步
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="entity-description">{item.description}</p>
              <div className="entity-stat-line">{item.stat}</div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState description="先放宽状态筛选或换关键词。" title="没有匹配信息源" />
      )}

      <Dialog
        description="信息源创建只收集草稿，不直接改数据源。"
        onClose={() => setCreateOpen(false)}
        open={createOpen}
        title="添加信息源"
        footer={
          <>
            <button className="btn secondary" onClick={() => setCreateOpen(false)} type="button">
              取消
            </button>
            <button
              className="btn primary"
              onClick={() => {
                props.onCreateSource?.({
                  name: draft.name.trim(),
                  kind: draft.kind,
                  status: draft.status,
                  icon: draft.icon.trim() || "S",
                  description: draft.description.trim(),
                  stat: draft.stat.trim()
                });
                setDraft({ name: "", kind: "api", status: "connected", icon: "S", description: "", stat: "" });
                setCreateOpen(false);
              }}
              type="button"
            >
              创建
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
            <span>名称</span>
            <input
              onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))}
              style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
              value={draft.name}
            />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
              <span>类型</span>
              <select
                onChange={(event) => setDraft((value) => ({ ...value, kind: event.target.value as SourceItem["kind"] }))}
                style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
                value={draft.kind}
              >
                {["webhook", "api", "polling", "cli", "sdk"].map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
              <span>状态</span>
              <select
                onChange={(event) => setDraft((value) => ({ ...value, status: event.target.value as SourceItem["status"] }))}
                style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
                value={draft.status}
              >
                {["connected", "warning", "offline"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
              <span>图标</span>
              <input
                onChange={(event) => setDraft((value) => ({ ...value, icon: event.target.value }))}
                style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
                value={draft.icon}
              />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
              <span>统计</span>
              <input
                onChange={(event) => setDraft((value) => ({ ...value, stat: event.target.value }))}
                style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
                value={draft.stat}
              />
            </label>
          </div>
          <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
            <span>描述</span>
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
