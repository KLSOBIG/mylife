import type { ReminderDetail } from "../../lib/types";

export function ReminderEditor({
  reminder,
  className
}: {
  reminder: ReminderDetail;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="reminder-editor__row">
        <span>提醒时间</span>
        <span>{reminder.at}</span>
      </div>
      <div className="reminder-editor__row">
        <span>重复规则</span>
        <span>{reminder.repeat}</span>
      </div>
    </div>
  );
}
