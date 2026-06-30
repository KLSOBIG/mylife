import { useState } from "react";
import "./month-panel.css";

const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const DEFAULT_WORKSPACES = [
  { id: "my-work", name: "我的工作" },
  { id: "product-lab", name: "产品实验" },
  { id: "study", name: "个人学习" }
];

export type WorkspaceOption = {
  id: string;
  name: string;
};

export type MonthPanelProps = {
  activeWorkspaceId?: string;
  initialSelectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  onSelectWorkspace?: (workspaceId: string) => void;
  showWorkspaces?: boolean;
  title?: string;
  today?: Date;
  workspaceTitle?: string;
  workspaces?: WorkspaceOption[];
};

type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
};

export function MonthPanel({
  activeWorkspaceId,
  initialSelectedDate,
  onSelectDate,
  onSelectWorkspace,
  showWorkspaces = false,
  title = "日历",
  today,
  workspaceTitle = "工作空间",
  workspaces = DEFAULT_WORKSPACES
}: MonthPanelProps) {
  const todayDate = toDateOnly(today ?? new Date());
  const [selectedDate, setSelectedDate] = useState(() =>
    toDateOnly(initialSelectedDate ?? todayDate)
  );
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(
    activeWorkspaceId ?? workspaces[0]?.id ?? ""
  );

  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const days = buildCalendarDays(monthStart);

  return (
    <div className="month-panel">
      <section className="month-panel__section">
        <h2 className="month-panel__label">{title}</h2>
        <h3 className="month-panel__title">{formatMonthHeading(monthStart)}</h3>
        <div aria-hidden="true" className="month-panel__weekdays">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className="month-panel__weekday">
              {label}
            </span>
          ))}
        </div>
        <div className="month-panel__calendar">
          {days.map(({ date, isCurrentMonth }) => {
            const isToday = isSameDay(date, todayDate);
            const isSelected = isSameDay(date, selectedDate);
            const className = [
              "month-panel__day",
              !isCurrentMonth ? "month-panel__day--outside" : "",
              isToday ? "month-panel__day--today" : "",
              isSelected ? "month-panel__day--selected" : ""
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={date.toISOString()}
                aria-current={isToday ? "date" : undefined}
                aria-label={formatDateLabel(date)}
                aria-pressed={isSelected}
                className={className}
                type="button"
                onClick={() => {
                  const nextDate = toDateOnly(date);
                  setSelectedDate(nextDate);
                  onSelectDate?.(nextDate);
                }}
              >
                <span>{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </section>

      {showWorkspaces ? (
        <section className="month-panel__section">
          <h2 className="month-panel__label">{workspaceTitle}</h2>
          <div className="month-panel__workspace-list">
            {workspaces.map((workspace) => {
              const isActive = workspace.id === selectedWorkspaceId;

              return (
                <button
                  key={workspace.id}
                  aria-pressed={isActive}
                  className={[
                    "month-panel__workspace",
                    isActive ? "month-panel__workspace--active" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  type="button"
                  onClick={() => {
                    setSelectedWorkspaceId(workspace.id);
                    onSelectWorkspace?.(workspace.id);
                  }}
                >
                  {workspace.name}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function buildCalendarDays(monthDate: Date): CalendarDay[] {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const gridStart = new Date(
    firstDay.getFullYear(),
    firstDay.getMonth(),
    firstDay.getDate() - firstDay.getDay()
  );
  const gridEnd = new Date(
    lastDay.getFullYear(),
    lastDay.getMonth(),
    lastDay.getDate() + (6 - lastDay.getDay())
  );
  const days: CalendarDay[] = [];

  for (let cursor = new Date(gridStart); cursor <= gridEnd; cursor.setDate(cursor.getDate() + 1)) {
    const day = new Date(cursor);
    days.push({
      date: day,
      isCurrentMonth: day.getMonth() === monthDate.getMonth()
    });
  }

  return days;
}

function toDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatMonthHeading(date: Date) {
  const monthNames = [
    "一月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "十一月",
    "十二月"
  ];

  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateLabel(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAY_LABELS[date.getDay()]}`;
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}
