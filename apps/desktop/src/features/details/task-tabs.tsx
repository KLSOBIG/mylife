type DetailTab = "details" | "gantt";

const tabs: Array<{ id: DetailTab; label: string }> = [
  { id: "details", label: "任务详情" },
  { id: "gantt", label: "甘特图" }
];

export function TaskTabs({
  activeTab,
  onChange
}: {
  activeTab: DetailTab;
  onChange: (tab: DetailTab) => void;
}) {
  return (
    <div className="task-tabs" role="tablist" aria-label="task-detail-tabs">
      {tabs.map((tab) => {
        const selected = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            id={`task-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`task-panel-${tab.id}`}
            className={selected ? "task-tabs__trigger is-active" : "task-tabs__trigger"}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
