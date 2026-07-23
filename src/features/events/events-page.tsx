import { useMemo, useState } from "react";
import type { AttentionLevel, EventItem } from "../../domain/types";
import { Dialog } from "../common/dialog";
import { EmptyState } from "../common/empty-state";

const filters: Array<"all" | AttentionLevel> = ["all", "L3", "L2", "L1", "L0"];

type EventCreateDraft = {
  title: string;
  source: string;
  sender: string;
  level: AttentionLevel;
  summary: string;
  tags: string;
};

const eventFields: Array<{ key: keyof Pick<EventCreateDraft, "title" | "source" | "sender">; label: string }> = [
  { key: "title", label: "标题" },
  { key: "source", label: "来源" },
  { key: "sender", label: "发送人" }
];

export function EventsPage(props: {
  events: EventItem[];
  selectedEventId?: string;
  activeFilter: "all" | AttentionLevel;
  sourceFilter?: "all" | string;
  onSelect: (eventId: string) => void;
  onFilterChange: (next: "all" | AttentionLevel) => void;
  onSourceFilterChange?: (next: "all" | string) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onCreate?: (draft: {
    title: string;
    source: string;
    sender: string;
    level: AttentionLevel;
    summary: string;
    tags: string[];
  }) => void;
}) {
  const [searchDraft, setSearchDraft] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<EventCreateDraft>({
    title: "",
    source: "",
    sender: "",
    level: "L2",
    summary: "",
    tags: ""
  });

  const searchValue = props.searchQuery ?? searchDraft;
  const sources = useMemo(() => ["all", ...new Set(props.events.map((item) => item.source))], [props.events]);
  const visibleEvents = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    return props.events.filter((item) => {
      const matchesFilter = props.activeFilter === "all" || item.level === props.activeFilter;
      const matchesSource = !props.sourceFilter || props.sourceFilter === "all" || item.source === props.sourceFilter;
      if (!matchesFilter) {
        return false;
      }
      if (!matchesSource) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return [item.title, item.source, item.sender, item.summary, item.tags.join(" ")].some((value) =>
        value.toLowerCase().includes(normalized)
      );
    });
  }, [props.activeFilter, props.events, props.sourceFilter, searchValue]);

  return (
    <div className="page-body">
      <div className="toolbar">
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <select
              aria-label="事件来源筛选"
              onChange={(event) => props.onSourceFilterChange?.(event.target.value)}
              style={{
                minWidth: 160,
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "11px 14px",
                outline: "none",
                background: "#fff"
              }}
              value={props.sourceFilter ?? "all"}
            >
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source === "all" ? "全部来源" : source}
                </option>
              ))}
            </select>
            <input
              aria-label="搜索事件"
              onChange={(event) => {
                const next = event.target.value;
                if (props.searchQuery === undefined) {
                  setSearchDraft(next);
                }
                props.onSearchChange?.(next);
              }}
              placeholder="搜索标题、来源、发送人、摘要、标签"
              style={{
                flex: "1 1 360px",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "11px 14px",
                outline: "none"
              }}
              value={searchValue}
            />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
            <div className="chips">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={filter === props.activeFilter ? "chip active" : "chip"}
                  onClick={() => props.onFilterChange(filter)}
                >
                  {filter === "all" ? "全部" : filter}
                </button>
              ))}
            </div>
            <button className="btn primary" onClick={() => setCreateOpen(true)} type="button">
              创建事件
            </button>
          </div>
        </div>
      </div>
      <div className="list-wrap">
        {visibleEvents.length ? (
          visibleEvents.map((item) => (
            <button
              type="button"
              key={item.id}
              className={item.id === props.selectedEventId ? "event-card selected" : "event-card"}
              onClick={() => props.onSelect(item.id)}
            >
              <div className={`level-pill ${item.level.toLowerCase()}`}>{item.level}</div>
              <div className="event-copy">
                <strong>{item.title}</strong>
                <p>
                  {item.source} / {item.sender} / {item.happenedAt}
                </p>
              </div>
            </button>
          ))
        ) : (
          <EmptyState
            description="先放宽筛选或换个关键词。"
            title="没有匹配事件"
          />
        )}
      </div>
      <Dialog
        description="填摘要后，主线程可接收创建回调。"
        onClose={() => setCreateOpen(false)}
        open={createOpen}
        title="创建事件"
        footer={
          <>
            <button className="btn secondary" onClick={() => setCreateOpen(false)} type="button">
              取消
            </button>
            <button
              className="btn primary"
              onClick={() => {
                props.onCreate?.({
                  title: draft.title.trim(),
                  source: draft.source.trim(),
                  sender: draft.sender.trim(),
                  level: draft.level,
                  summary: draft.summary.trim(),
                  tags: draft.tags
                    .split(/[,\n]/)
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                });
                setDraft({ title: "", source: "", sender: "", level: "L2", summary: "", tags: "" });
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
          {eventFields.map((field) => (
            <label key={field.key} style={{ display: "grid", gap: 6, fontSize: 12 }}>
              <span>{field.label}</span>
              <input
                onChange={(event) => setDraft((value) => ({ ...value, [field.key]: event.target.value }))}
                style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
                value={draft[field.key]}
              />
            </label>
          ))}
          <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
            <span>级别</span>
            <select
              onChange={(event) => setDraft((value) => ({ ...value, level: event.target.value as AttentionLevel }))}
              style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
              value={draft.level}
            >
              {["L3", "L2", "L1", "L0"].map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
            <span>摘要</span>
            <textarea
              onChange={(event) => setDraft((value) => ({ ...value, summary: event.target.value }))}
              rows={4}
              style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px", resize: "vertical" }}
              value={draft.summary}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
            <span>标签</span>
            <input
              onChange={(event) => setDraft((value) => ({ ...value, tags: event.target.value }))}
              placeholder="用逗号或换行分隔"
              style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
              value={draft.tags}
            />
          </label>
        </div>
      </Dialog>
    </div>
  );
}
