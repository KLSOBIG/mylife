import { useMemo, useState } from "react";
import type { AttentionLevel, RuleItem } from "../../domain/types";
import { Dialog } from "../common/dialog";
import { EmptyState } from "../common/empty-state";

const levels: Array<"all" | AttentionLevel> = ["all", "L3", "L2", "L1", "L0"];

type RuleDraft = {
  name: string;
  description: string;
  level: AttentionLevel;
  condition: string;
  action: string;
};

export function RulesPage(props: {
  rules: RuleItem[];
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  levelFilter?: "all" | AttentionLevel;
  onLevelFilterChange?: (next: "all" | AttentionLevel) => void;
  onToggleRule?: (ruleId: string, nextEnabled: boolean) => void;
  onCreateRule?: (draft: {
    name: string;
    description: string;
    level: AttentionLevel;
    condition: string;
    action: string;
  }) => void;
  suggestedRules?: Array<{
    name: string;
    description: string;
    level: AttentionLevel;
    condition: string;
    action: string;
  }>;
  onApplySuggestion?: (index: number) => void;
}) {
  const [searchDraft, setSearchDraft] = useState("");
  const [levelDraft, setLevelDraft] = useState<"all" | AttentionLevel>("all");
  const [localEnabled, setLocalEnabled] = useState<Record<string, boolean>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [draft, setDraft] = useState<RuleDraft>({
    name: "",
    description: "",
    level: "L2",
    condition: "",
    action: ""
  });

  const searchValue = props.searchQuery ?? searchDraft;
  const activeLevelFilter = props.levelFilter ?? levelDraft;
  const visibleRules = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    return props.rules.filter((item) => {
      const matchesLevel = activeLevelFilter === "all" || item.level === activeLevelFilter;
      if (!matchesLevel) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return [item.name, item.description, item.condition, item.action, item.level].join(" ").toLowerCase().includes(normalized);
    });
  }, [activeLevelFilter, props.rules, searchValue]);

  return (
    <div className="page-scroll">
      <div className="page-topbar">
        <div>
          <h2 className="page-section-title">规则引擎</h2>
          <p className="page-section-subtitle">规则是对分发的增强，通过对话创建，系统调用执行器生成</p>
        </div>
        <button className="btn btn-p" onClick={() => setCreateOpen(true)} type="button">
          + 通过对话创建规则
        </button>
      </div>

      <div className="mini-stats-row">
        <div className="mini-stat-card">
          <div className="mini-stat-card__value mini-stat-card__value--accent">{props.rules.filter((item) => item.enabled).length}</div>
          <div className="mini-stat-card__label">活跃规则</div>
        </div>
        <div className="mini-stat-card">
          <div className="mini-stat-card__value mini-stat-card__value--green">{props.rules.reduce((sum, item) => sum + item.triggeredCount, 0)}</div>
          <div className="mini-stat-card__label">今日触发</div>
        </div>
        <div className="mini-stat-card">
          <div className="mini-stat-card__value mini-stat-card__value--yellow">{props.rules.filter((item) => item.level === "L0").length}</div>
          <div className="mini-stat-card__label">已拦截</div>
        </div>
        <div className="mini-stat-card">
          <div className="mini-stat-card__value mini-stat-card__value--blue">{props.rules.filter((item) => item.level !== "L0").length}</div>
          <div className="mini-stat-card__label">已分发</div>
        </div>
      </div>

      <div className="rules-toolbar">
        <div className="chips">
          {levels.map((level) => (
            <button
              className={level === activeLevelFilter ? "chip active" : "chip"}
              key={level}
              onClick={() => {
                if (props.levelFilter === undefined) {
                  setLevelDraft(level);
                }
                props.onLevelFilterChange?.(level);
              }}
              type="button"
            >
              {level === "all" ? "全部" : level}
            </button>
          ))}
        </div>
        <div className="rules-toolbar-actions">
          <input
            aria-label="搜索规则"
            className="tasks-search"
            onChange={(event) => {
              const next = event.target.value;
              if (props.searchQuery === undefined) {
                setSearchDraft(next);
              }
              props.onSearchChange?.(next);
            }}
            placeholder="搜索名称、描述、条件、动作"
            value={searchValue}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn secondary" onClick={() => setSuggestOpen(true)} type="button">
              建议规则
            </button>
            <button className="btn btn-p" onClick={() => setCreateOpen(true)} type="button">
              创建规则
            </button>
          </div>
        </div>
      </div>

      {props.suggestedRules?.length ? (
        <div className="rule-suggestion-card">
          <div className="rule-suggestion-card__title">✨ AI 建议的规则</div>
          <p>基于你的使用模式，AI 建议以下规则：</p>
          <div className="rule-suggestion-list">
            {props.suggestedRules.slice(0, 2).map((item, index) => (
              <div className="rule-suggestion-item" key={`${item.name}-${index}`}>
                <div className="rule-suggestion-item__copy">
                  <strong>{item.name}</strong>
                  <span>{item.description}</span>
                </div>
                <button className="btn btn-sm" onClick={() => props.onApplySuggestion?.(index)} type="button">
                  添加
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <h3 className="subsection-title">活跃规则</h3>
      {visibleRules.length ? (
        visibleRules.map((item) => (
          <article key={item.id} className="rule-card">
            {(() => {
              const enabled = props.onToggleRule ? item.enabled : localEnabled[item.id] ?? item.enabled;
              return (
                <div className="rule-header">
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <button
                    aria-label={`切换规则 ${item.name}`}
                    className={enabled ? "rule-toggle on" : "rule-toggle"}
                    onClick={() => {
                      if (props.onToggleRule) {
                        props.onToggleRule(item.id, !item.enabled);
                        return;
                      }
                      setLocalEnabled((current) => ({ ...current, [item.id]: !enabled }));
                    }}
                    type="button"
                  >
                    <span className="sr-only">{enabled ? "已启用" : "已停用"}</span>
                  </button>
                </div>
              );
            })()}
            <div className="rule-cond">{item.condition}</div>
            <div className="rule-action">{item.action}</div>
            <div className="rule-meta">
              <span>{item.level}</span>
              <span>触发 {item.triggeredCount}</span>
              <span>成功率 {item.successRate}%</span>
            </div>
          </article>
        ))
      ) : (
        <EmptyState description="换关键词或改级别筛选。" title="没有匹配规则" />
      )}

      <Dialog
        description="这只是创建 UI。创建动作交给主线程。"
        onClose={() => setCreateOpen(false)}
        open={createOpen}
        title="创建规则"
        footer={
          <>
            <button className="btn secondary" onClick={() => setCreateOpen(false)} type="button">
              取消
            </button>
            <button
              className="btn primary"
              onClick={() => {
                props.onCreateRule?.({
                  name: draft.name.trim(),
                  description: draft.description.trim(),
                  level: draft.level,
                  condition: draft.condition.trim(),
                  action: draft.action.trim()
                });
                setDraft({ name: "", description: "", level: "L2", condition: "", action: "" });
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
          <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
            <span>描述</span>
            <input
              onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))}
              style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}
              value={draft.description}
            />
          </label>
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
            <span>条件</span>
            <textarea
              onChange={(event) => setDraft((value) => ({ ...value, condition: event.target.value }))}
              rows={4}
              style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px", resize: "vertical" }}
              value={draft.condition}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
            <span>动作</span>
            <textarea
              onChange={(event) => setDraft((value) => ({ ...value, action: event.target.value }))}
              rows={3}
              style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px", resize: "vertical" }}
              value={draft.action}
            />
          </label>
        </div>
      </Dialog>

      <Dialog description="建议规则先展示，应用动作交给主线程。" onClose={() => setSuggestOpen(false)} open={suggestOpen} title="建议规则">
        <div style={{ display: "grid", gap: 12 }}>
          {props.suggestedRules?.length ? (
            props.suggestedRules.map((item, index) => (
              <article className="rule-card" key={`${item.name}-${index}`}>
                <div className="rule-header">
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <span className="status-chip status-chip--suggestion">{item.level}</span>
                </div>
                <div className="rule-cond">{item.condition}</div>
                <div className="rule-action">{item.action}</div>
                <button className="btn btn-p" onClick={() => props.onApplySuggestion?.(index)} type="button">
                  应用建议
                </button>
              </article>
            ))
          ) : (
            <EmptyState description="主线程还没喂建议数据。" title="暂无建议规则" />
          )}
        </div>
      </Dialog>
    </div>
  );
}
