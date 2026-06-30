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
      <span className="reminder-editor__pill">
        <span>提醒</span>
        <strong>{reminder.at}</strong>
      </span>
      <span className="reminder-editor__pill">
        <span>重复</span>
        <strong>{reminder.repeat}</strong>
      </span>
    </div>
  );
}
