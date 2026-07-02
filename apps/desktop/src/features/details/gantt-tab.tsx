import { useMemo, useState } from "react";
import type { TaskStatus, TimelineRow, TimelineSegment } from "../../lib/types";

const filters: Array<{ label: string; value: TaskStatus | "all" }> = [
  { label: "全部", value: "all" },
  { label: "未开始", value: "not_started" },
  { label: "进行中", value: "in_progress" },
  { label: "搁置", value: "shelved" },
  { label: "已完成", value: "completed" },
  { label: "废弃", value: "abandoned" }
];

const weekdayNames = ["日", "一", "二", "三", "四", "五", "六"];

export function GanttTab({
  task
}: {
  task: {
    rows: TimelineRow[];
  };
}) {
  const [activeFilter, setActiveFilter] = useState<TaskStatus | "all">("all");
  const rows = useMemo(
    () =>
      activeFilter === "all"
        ? task.rows
        : task.rows
            .map((row) => ({
              ...row,
              segments: row.segments.filter((segment) => segment.status === activeFilter)
            }))
            .filter((row) => row.segments.length > 0),
    [activeFilter, task.rows]
  );
  const axis = useMemo(() => buildAxis(rows), [rows]);

  return (
    <section className="gantt-tab">
      <header className="gantt-tab__header">
        <div className="gantt-tab__heading">
          <h2>甘特视图</h2>
          <p>状态时间段落座在日期轴上</p>
        </div>
        <div className="gantt-filters" role="group" aria-label="gantt-status-filters">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              className={activeFilter === item.value ? "gantt-filter is-active" : "gantt-filter"}
              onClick={() => setActiveFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {axis.days.length > 0 ? (
        <section className="gantt-chart" aria-label="gantt-date-axis">
          <div
            className="gantt-chart__header"
            style={{ gridTemplateColumns: `200px repeat(${axis.days.length}, minmax(72px, 1fr))` }}
          >
            <div className="gantt-chart__corner">任务 / 日期</div>
            {axis.days.map((day) => (
              <div key={day.key} className="gantt-chart__day">
                <span className="gantt-chart__day-number">{day.label}</span>
                <span className="gantt-chart__day-weekday">周{day.weekday}</span>
              </div>
            ))}
          </div>

          <div className="gantt-rows">
            {rows.map((row) => (
              <div
                key={row.id}
                className="gantt-row"
                aria-label={`gantt-row-${row.title}`}
                style={{ gridTemplateColumns: `200px repeat(${axis.days.length}, minmax(72px, 1fr))` }}
              >
                <div className="gantt-row__title">{row.title}</div>
                <div
                  className="gantt-row__track"
                  style={{ gridTemplateColumns: `repeat(${axis.days.length}, minmax(72px, 1fr))` }}
                >
                  {axis.days.map((day) => (
                    <span key={day.key} className="gantt-row__cell" aria-hidden="true" />
                  ))}
                  {row.segments.map((segment) => {
                    const placement = getSegmentPlacement(segment, axis.startAt);
                    return (
                      <span
                        key={segment.id}
                        className={`gantt-segment gantt-segment--${segment.status}`}
                        style={{
                          gridColumn: `${placement.start} / ${placement.end}`
                        }}
                        title={`${formatRange(segment.startAt, segment.endAt)} · ${statusLabel(segment.status)}`}
                      >
                        <span className="gantt-segment__label">{statusLabel(segment.status)}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="gantt-empty">暂无时间轴数据</div>
      )}
    </section>
  );
}

function buildAxis(rows: TimelineRow[]) {
  const segments = rows.flatMap((row) => row.segments);
  if (segments.length === 0) {
    return {
      startAt: startOfDay(new Date()),
      endAt: startOfDay(new Date()),
      days: [] as Array<{ key: string; label: string; weekday: string }>
    };
  }

  const startAt = startOfDay(
    new Date(
      Math.min(...segments.map((segment) => new Date(segment.startAt).getTime()))
    )
  );
  const endAt = startOfDay(
    new Date(
      Math.max(...segments.map((segment) => new Date(segment.endAt).getTime()))
    )
  );
  const days = [];

  for (const cursor = new Date(startAt); cursor <= endAt; cursor.setDate(cursor.getDate() + 1)) {
    const day = new Date(cursor);
    days.push({
      key: day.toISOString(),
      label: `${day.getMonth() + 1}/${day.getDate()}`,
      weekday: weekdayNames[day.getDay()]
    });
  }

  return { startAt, endAt, days };
}

function getSegmentPlacement(segment: TimelineSegment, axisStart: Date) {
  const start = startOfDay(new Date(segment.startAt));
  const end = startOfDay(new Date(segment.endAt));
  const startColumn = diffDays(axisStart, start) + 1;
  const endColumn = diffDays(axisStart, end) + 2;

  return {
    start: Math.max(startColumn, 1),
    end: Math.max(endColumn, startColumn + 1)
  };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffDays(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function statusLabel(status: TaskStatus) {
  switch (status) {
    case "not_started":
      return "未开始";
    case "in_progress":
      return "进行中";
    case "shelved":
      return "搁置";
    case "completed":
      return "已完成";
    case "abandoned":
      return "废弃";
  }
}

function formatRange(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
}
