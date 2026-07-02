import { useEffect, useMemo, useState } from "react";
import type { ReminderDetail } from "../../lib/types";

const weekdayOptions = [
  { value: 1, label: "一" },
  { value: 2, label: "二" },
  { value: 3, label: "三" },
  { value: 4, label: "四" },
  { value: 5, label: "五" },
  { value: 6, label: "六" },
  { value: 0, label: "日" }
];

export function ReminderEditor({
  reminder,
  className,
  onChange
}: {
  reminder: ReminderDetail;
  className?: string;
  onChange?: (reminder: ReminderDetail) => void;
}) {
  const normalized = useMemo(() => normalizeReminder(reminder), [reminder]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(normalized);

  useEffect(() => {
    setDraft(normalized);
  }, [normalized]);

  function commit(nextDraft: ReminderDraft) {
    setDraft(nextDraft);
    onChange?.(toReminderDetail(nextDraft));
  }

  function toggleWeekday(day: number) {
    const nextWeekdays = draft.weekdays.includes(day)
      ? draft.weekdays.filter((item) => item !== day)
      : [...draft.weekdays, day].sort((left, right) => left - right);

    commit({
      ...draft,
      weekdays: nextWeekdays
    });
  }

  return (
    <div className={className}>
      <button type="button" className="reminder-editor__summary" onClick={() => setOpen((current) => !current)}>
        <span className="reminder-editor__pill">
          <span>提醒</span>
          <strong>{draft.enabled ? formatAt(draft.dateTime) : "未设置"}</strong>
        </span>
        <span className="reminder-editor__pill">
          <span>重复</span>
          <strong>{formatRepeat(draft.repeatKind, draft.weekdays)}</strong>
        </span>
      </button>
      {open ? (
        <div className="reminder-editor__panel" role="group" aria-label="reminder-editor">
          <label className="reminder-editor__toggle">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(event) =>
                commit({
                  ...draft,
                  enabled: event.target.checked
                })
              }
            />
            启用提醒
          </label>
          <label className="reminder-editor__field">
            <span>时间</span>
            <input
              type="datetime-local"
              value={draft.dateTime}
              onChange={(event) =>
                commit({
                  ...draft,
                  dateTime: event.target.value
                })
              }
            />
          </label>
          <label className="reminder-editor__field">
            <span>重复</span>
            <select
              value={draft.repeatKind}
              onChange={(event) =>
                commit({
                  ...draft,
                  repeatKind: event.target.value as ReminderDraft["repeatKind"]
                })
              }
            >
              <option value="none">不重复</option>
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
            </select>
          </label>
          {draft.repeatKind === "weekly" ? (
            <div className="reminder-editor__weekday-row" role="group" aria-label="weekly-days">
              {weekdayOptions.map((option) => {
                const active = draft.weekdays.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={active ? "reminder-editor__weekday is-active" : "reminder-editor__weekday"}
                    aria-pressed={active}
                    onClick={() => toggleWeekday(option.value)}
                  >
                    周{option.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type ReminderDraft = {
  enabled: boolean;
  dateTime: string;
  repeatKind: "none" | "daily" | "weekly";
  weekdays: number[];
};

function normalizeReminder(reminder: ReminderDetail): ReminderDraft {
  return {
    enabled: reminder.enabled ?? Boolean(reminder.dateTime || reminder.at),
    dateTime: reminder.dateTime ?? "",
    repeatKind: reminder.repeatKind ?? "none",
    weekdays: reminder.weekdays ?? []
  };
}

function toReminderDetail(draft: ReminderDraft): ReminderDetail {
  return {
    enabled: draft.enabled,
    dateTime: draft.dateTime,
    repeatKind: draft.repeatKind,
    weekdays: draft.weekdays,
    at: formatAt(draft.dateTime),
    repeat: formatRepeat(draft.repeatKind, draft.weekdays)
  };
}

function formatAt(dateTime: string) {
  if (!dateTime) {
    return "";
  }

  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatRepeat(kind: ReminderDraft["repeatKind"], weekdays: number[]) {
  switch (kind) {
    case "daily":
      return "每天";
    case "weekly":
      return weekdays.length > 0 ? weekdays.map((day) => `周${"日一二三四五六"[day]}`).join(" / ") : "每周";
    default:
      return "不重复";
  }
}
