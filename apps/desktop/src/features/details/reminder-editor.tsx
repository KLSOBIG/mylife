import type { ReminderDetail } from "../../lib/types";

export function ReminderEditor({ reminder }: { reminder: ReminderDetail }) {
  return (
    <div>
      <div>{reminder.at}</div>
      <div>{reminder.repeat}</div>
    </div>
  );
}
