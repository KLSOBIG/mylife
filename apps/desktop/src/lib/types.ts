export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "abandoned";

export type ChecklistItem = {
  id: string;
  title: string;
  status: "not_started" | "completed";
};

export type ReminderDetail = {
  at: string;
  repeat: string;
};

export type TimelineSegment = {
  id: string;
  status: TaskStatus;
  width: string;
};

export type TimelineRow = {
  id: string;
  title: string;
  segments: TimelineSegment[];
};

export type TaskSummary = {
  id: string;
  title: string;
  status: TaskStatus;
  isToday: boolean;
  reminderLabel?: string;
};

export type TaskDetail = {
  id: string;
  title: string;
  document: string;
  reminder: ReminderDetail;
  checklist: ChecklistItem[];
  status?: TaskStatus;
  timeline?: {
    rows: TimelineRow[];
  };
};

export type WidgetTask = {
  id: string;
  title: string;
  status: TaskStatus;
};
