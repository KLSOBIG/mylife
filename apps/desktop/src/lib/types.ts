export type ChecklistItem = {
  id: string;
  title: string;
  status: "not_started" | "completed";
};

export type ReminderDetail = {
  at: string;
  repeat: string;
};

export type TaskDetail = {
  id: string;
  title: string;
  document: string;
  reminder: ReminderDetail;
  checklist: ChecklistItem[];
};
