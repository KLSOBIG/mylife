export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "shelved"
  | "completed"
  | "abandoned";

export type ChecklistItem = {
  id: string;
  title: string;
  status: "not_started" | "completed";
};

export type ChecklistTreeNode = {
  id: string;
  title: string;
  checked: boolean;
  depth: number;
  children: ChecklistTreeNode[];
};

export type ReminderDetail = {
  at: string;
  repeat: string;
};

export type TimelineSegment = {
  id: string;
  status: TaskStatus;
  startAt: string;
  endAt: string;
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
  checklistCount?: number;
  checklistTree?: ChecklistTreeNode[];
};

export type TaskLane = {
  status: TaskStatus;
  label: string;
  tasks: TaskSummary[];
  count: number;
};

export type TaskMoveRequest = {
  taskId: string;
  toStatus: TaskStatus;
  toIndex: number;
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
