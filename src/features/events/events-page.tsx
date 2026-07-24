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
  const groupedEvents = useMemo(
    () => ({
      L3: visibleEvents.filter((item) => item.level === "L3"),
      L2: visibleEvents.filter((item) => item.level === "L2"),
      L1: visibleEvents.filter((item) => item.level === "L1"),
      L0: visibleEvents.filter((item) => item.level === "L0")
    }),
    [visibleEvents]
  );

  return (
    <div className="page events-page">
      <div className="events-toolbar">
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
        <div className="events-toolbar__right">
          <select
            aria-label="事件来源筛选"
            className="events-source-filter"
            onChange={(event) => props.onSourceFilterChange?.(event.target.value)}
            value={props.sourceFilter ?? "all"}
          >
            {sources.map((source) => (
              <option key={source} value={source}>
                {source === "all" ? "全部来源" : source}
              </option>
            ))}
          </select>
          <div className="search">
            <span className="si">🔍</span>
            <input
              aria-label="搜索事件"
              onChange={(event) => {
                const next = event.target.value;
                if (props.searchQuery === undefined) {
                  setSearchDraft(next);
                }
                props.onSearchChange?.(next);
              }}
              placeholder="搜索事件..."
              value={searchValue}
            />
          </div>
          <button className="btn btn-p" onClick={() => setCreateOpen(true)} type="button">
            + 新建事件
          </button>
        </div>
      </div>
      <div className="events-list">
        {visibleEvents.length ? (
          (["L3", "L2", "L1", "L0"] as const).map((level) =>
            groupedEvents[level].length ? (
              <section className="events-group" key={level}>
                <div className={`events-group-title events-group-title--${level.toLowerCase()}`}>
                  <span>{levelLabel(level)}</span>
                  <small>{groupedEvents[level].length} 件</small>
                </div>
                {groupedEvents[level].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={item.id === props.selectedEventId ? "event-card selected" : "event-card"}
                    onClick={() => props.onSelect(item.id)}
                  >
                    <div className={`event-priority event-priority--${level.toLowerCase()}`}>{levelGlyph(level)}</div>
                    <div className="event-content">
                      <div className="event-title">{item.title}</div>
                      <div className="event-meta">
                        <span>{item.source}</span>
                        <span>{item.sender}</span>
                        <span>{item.happenedAt}</span>
                        <div className="event-tags">
                          <span className={`tag tag--${level.toLowerCase()}`}>{level}</span>
                          {item.tags.slice(0, 2).map((tag) => (
                            <span className="tag" key={tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </section>
            ) : null
          )
        ) : (
          <EmptyState
            description="先放宽筛选或换个关键词。"
            title="没有匹配事件"
          />
        )}
      </div>
      <Dialog
        description="补齐来源、发送人和摘要。创建后进入事件流。"
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
        <div className="dialog-form">
          {eventFields.map((field) => (
            <label key={field.key} className="dialog-field">
              <span>{field.label}</span>
              <input
                onChange={(event) => setDraft((value) => ({ ...value, [field.key]: event.target.value }))}
                className="dialog-input-control"
                value={draft[field.key]}
              />
            </label>
          ))}
          <label className="dialog-field">
            <span>级别</span>
            <select
              onChange={(event) => setDraft((value) => ({ ...value, level: event.target.value as AttentionLevel }))}
              className="dialog-input-control"
              value={draft.level}
            >
              {["L3", "L2", "L1", "L0"].map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <label className="dialog-field">
            <span>摘要</span>
            <textarea
              onChange={(event) => setDraft((value) => ({ ...value, summary: event.target.value }))}
              rows={4}
              className="dialog-input-control dialog-input-control--textarea"
              value={draft.summary}
            />
          </label>
          <label className="dialog-field">
            <span>标签</span>
            <input
              onChange={(event) => setDraft((value) => ({ ...value, tags: event.target.value }))}
              placeholder="用逗号或换行分隔"
              className="dialog-input-control"
              value={draft.tags}
            />
          </label>
        </div>
      </Dialog>
    </div>
  );
}

function levelLabel(level: AttentionLevel) {
  switch (level) {
    case "L3":
      return "🔴 L3 必须你关注";
    case "L2":
      return "🟡 L2 Agent 处理中";
    case "L1":
      return "🔵 L1 AI 追踪中";
    case "L0":
      return "⚪ L0 已隔离";
  }
}

function levelGlyph(level: AttentionLevel) {
  switch (level) {
    case "L3":
      return "⚡";
    case "L2":
      return "▾";
    case "L1":
      return "·";
    case "L0":
      return "○";
  }
}
