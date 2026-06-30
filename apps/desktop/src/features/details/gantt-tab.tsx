import type { TimelineRow } from "../../lib/types";

const filters = ["未开始", "进行中", "已完成", "废弃"];

export function GanttTab({
  task
}: {
  task: {
    rows: TimelineRow[];
  };
}) {
  return (
    <section className="gantt-tab">
      <div className="gantt-filters">
        {filters.map((item) => (
          <button key={item} type="button" className="gantt-filter">
            {item}
          </button>
        ))}
      </div>
      <div className="gantt-rows">
        {task.rows.map((row) => (
          <div key={row.id} className="gantt-row" aria-label={`gantt-row-${row.title}`}>
            <span className="gantt-row__title">{row.title}</span>
            <div className="gantt-row__track">
              {row.segments.map((segment) => (
                <span
                  key={segment.id}
                  className={`gantt-segment gantt-segment--${segment.status}`}
                  style={{ width: segment.width }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
