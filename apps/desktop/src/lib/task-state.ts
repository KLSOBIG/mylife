import type {
  ChecklistItem,
  ChecklistTreeNode,
  ReminderDetail,
  TaskDetail,
  TaskLane,
  TaskMoveRequest,
  TaskStatus,
  TaskSummary,
  TimelineRow
} from "./types";

export const taskStatusOrder: TaskStatus[] = [
  "not_started",
  "in_progress",
  "shelved",
  "completed",
  "abandoned"
];

export const statusMeta: Record<
  TaskStatus,
  { label: string; chipClass: string }
> = {
  not_started: { label: "未开始", chipClass: "status-slate" },
  in_progress: { label: "进行中", chipClass: "status-amber" },
  shelved: { label: "搁置", chipClass: "status-indigo" },
  completed: { label: "已完成", chipClass: "status-green" },
  abandoned: { label: "废弃", chipClass: "status-rose" }
};

export const themes = ["olive", "amber", "slate"] as const;
export type ThemeName = (typeof themes)[number];
export const themePresets: Record<ThemeName, { accentColor: string; backgroundColor: string }> = {
  olive: { accentColor: "#3f5f52", backgroundColor: "#f7f6f3" },
  amber: { accentColor: "#8b5e3c", backgroundColor: "#f8f3ec" },
  slate: { accentColor: "#45596d", backgroundColor: "#f2f5f8" }
};

export const workspaceOptions = [
  { id: "my-work", name: "我的工作" },
  { id: "product-lab", name: "产品实验" },
  { id: "study", name: "个人学习" }
] as const;

export type TaskRecord = {
  id: string;
  workspaceId: string;
  title: string;
  status: TaskStatus;
  isToday: boolean;
  reminder: ReminderDetail;
  checklist: ChecklistItem[];
  document: string;
  timeline: TimelineRow[];
};

export function buildTaskSummary(task: TaskRecord): TaskSummary {
  const checklistTree = buildChecklistTree(task.document, task.checklist);
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    isToday: task.isToday,
    reminderLabel: formatReminderLabel(task.reminder),
    checklistCount: countChecklistTree(checklistTree),
    checklistTree
  };
}

export function buildTaskDetail(task: TaskRecord): TaskDetail {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    document: task.document,
    reminder: normalizeReminder(task.reminder),
    checklist: task.checklist,
    timeline: {
      rows: buildTimelineRows(task)
    }
  };
}

export function createTaskRecord(title: string, index: number, workspaceId: string): TaskRecord {
  const createdAt = new Date().toISOString();

  return {
    id: `task_${Date.now()}_${index}`,
    workspaceId,
    title,
    status: "not_started",
    isToday: true,
    reminder: normalizeReminder({ enabled: false, dateTime: "", repeatKind: "none", weekdays: [] }),
    checklist: [{ id: `item_${Date.now()}_${index}`, title: `拆解：${title}`, status: "not_started" }],
    document: `- [ ] 拆解：${title}`,
    timeline: [
      {
        id: `row_${Date.now()}_${index}`,
        title,
        segments: [{ id: `seg_${Date.now()}_${index}`, status: "not_started", startAt: createdAt, endAt: createdAt }]
      }
    ]
  };
}

export function completeTask(task: TaskRecord): TaskRecord {
  return applyStatus(task, "completed");
}

export function shelveTask(task: TaskRecord): TaskRecord {
  return applyStatus(task, "shelved");
}

export function resumeTask(task: TaskRecord): TaskRecord {
  return applyStatus(task, "in_progress");
}

export function updateTaskDocument(task: TaskRecord, document: string): TaskRecord {
  return {
    ...task,
    document,
    checklist: buildChecklistItems(document, task.checklist)
  };
}

export function updateTaskReminder(task: TaskRecord, reminder: ReminderDetail): TaskRecord {
  return {
    ...task,
    reminder: normalizeReminder(reminder)
  };
}

export function applyStatus(task: TaskRecord, status: TaskStatus): TaskRecord {
  if (task.status === status) {
    return task;
  }

  const now = new Date().toISOString();
  const mainRow = ensureMainTimelineRow(task, now);
  const previousSegments = mainRow.segments;
  const lastSegment = previousSegments[previousSegments.length - 1];
  const nextSegments = previousSegments.map((segment, index) =>
    index === previousSegments.length - 1
      ? {
          ...segment,
          endAt: now
        }
      : segment
  );

  if (!lastSegment || lastSegment.status !== status) {
    nextSegments.push({
      id: `${mainRow.id}_${nextSegments.length + 1}`,
      status,
      startAt: now,
      endAt: now
    });
  }

  return {
    ...task,
    status,
    timeline: [
      {
        ...mainRow,
        title: task.title,
        segments: nextSegments
      }
    ]
  };
}

export function seedTasks(): TaskRecord[] {
  return [
    {
      id: "task_seed_1",
      workspaceId: "my-work",
      title: "重构任务时间轴存储",
      status: "in_progress",
      isToday: true,
      reminder: normalizeReminder({
        enabled: true,
        dateTime: "2026-06-30T14:00",
        repeatKind: "weekly",
        weekdays: [1, 3, 5]
      }),
      checklist: [
        { id: "check_1", title: "定义 task_events 表", status: "not_started" },
        { id: "check_2", title: "补状态颜色映射", status: "completed" }
      ],
      document: "- [ ] 定义 task_events 表\n- [x] 补状态颜色映射",
      timeline: [
        {
          id: "row_main_1",
          title: "重构任务时间轴存储",
          segments: [
            { id: "seg_1", status: "not_started", startAt: "2026-06-28T09:00:00.000Z", endAt: "2026-06-29T12:00:00.000Z" },
            { id: "seg_2", status: "in_progress", startAt: "2026-06-30T09:00:00.000Z", endAt: "2026-06-30T09:00:00.000Z" }
          ]
        }
      ]
    },
    {
      id: "task_seed_2",
      workspaceId: "my-work",
      title: "设计桌面小窗交互",
      status: "shelved",
      isToday: true,
      reminder: normalizeReminder({
        enabled: true,
        dateTime: "2026-07-01T09:00",
        repeatKind: "daily",
        weekdays: []
      }),
      checklist: [{ id: "check_3", title: "定义小窗按钮状态", status: "not_started" }],
      document: "- [ ] 定义小窗按钮状态",
      timeline: [
        {
          id: "row_main_2",
          title: "设计桌面小窗交互",
          segments: [
            { id: "seg_5", status: "not_started", startAt: "2026-06-29T08:00:00.000Z", endAt: "2026-06-29T16:00:00.000Z" },
            { id: "seg_6", status: "in_progress", startAt: "2026-06-30T10:00:00.000Z", endAt: "2026-07-01T12:00:00.000Z" },
            { id: "seg_7", status: "shelved", startAt: "2026-07-01T12:00:00.000Z", endAt: "2026-07-01T12:00:00.000Z" }
          ]
        }
      ]
    },
    {
      id: "task_seed_3",
      workspaceId: "product-lab",
      title: "整理产品实验路线图",
      status: "not_started",
      isToday: true,
      reminder: normalizeReminder({
        enabled: false,
        dateTime: "",
        repeatKind: "none",
        weekdays: []
      }),
      checklist: [{ id: "check_4", title: "列出实验假设", status: "not_started" }],
      document: "- [ ] 列出实验假设",
      timeline: [
        {
          id: "row_main_3",
          title: "整理产品实验路线图",
          segments: [
            { id: "seg_8", status: "not_started", startAt: "2026-06-30T08:00:00.000Z", endAt: "2026-06-30T08:00:00.000Z" }
          ]
        }
      ]
    },
    {
      id: "task_seed_4",
      workspaceId: "study",
      title: "复习 Go 并发模式",
      status: "in_progress",
      isToday: true,
      reminder: normalizeReminder({
        enabled: true,
        dateTime: "2026-06-30T20:00",
        repeatKind: "weekly",
        weekdays: [2, 4]
      }),
      checklist: [{ id: "check_5", title: "整理 worker pool 笔记", status: "not_started" }],
      document: "- [ ] 整理 worker pool 笔记",
      timeline: [
        {
          id: "row_main_4",
          title: "复习 Go 并发模式",
          segments: [
            { id: "seg_9", status: "not_started", startAt: "2026-06-29T19:00:00.000Z", endAt: "2026-06-30T10:00:00.000Z" },
            { id: "seg_10", status: "in_progress", startAt: "2026-06-30T10:00:00.000Z", endAt: "2026-06-30T10:00:00.000Z" }
          ]
        }
      ]
    }
  ];
}

export function buildTaskLanes(tasks: TaskSummary[]): TaskLane[] {
  const grouped = createEmptyStatusMap<TaskSummary[]>(
    () => []
  );

  for (const task of tasks) {
    grouped[task.status].push(task);
  }

  return taskStatusOrder.map((status) => ({
    status,
    label: statusMeta[status].label,
    tasks: grouped[status],
    count: grouped[status].length
  }));
}

export function moveTaskSummaries(
  tasks: TaskSummary[],
  request: TaskMoveRequest
): TaskSummary[] {
  return moveTasks(tasks, request, (task, status) =>
    task.status === status ? task : { ...task, status }
  );
}

export function moveTaskRecords(
  tasks: TaskRecord[],
  request: TaskMoveRequest
): TaskRecord[] {
  return moveTasks(tasks, request, (task, status) =>
    task.status === status ? task : applyStatus(task, status)
  );
}

function moveTasks<T extends { id: string; status: TaskStatus }>(
  tasks: T[],
  request: TaskMoveRequest,
  updateStatus: (task: T, status: TaskStatus) => T
): T[] {
  const current = tasks.find((task) => task.id === request.taskId);
  if (!current) {
    return tasks;
  }

  const remaining = tasks.filter((task) => task.id !== request.taskId);
  const grouped = createEmptyStatusMap<T[]>(
    () => []
  );

  for (const task of remaining) {
    grouped[task.status].push(task);
  }

  const nextTask = updateStatus(current, request.toStatus);
  const lane = grouped[request.toStatus];
  const nextIndex = clamp(request.toIndex, 0, lane.length);
  lane.splice(nextIndex, 0, nextTask);

  return taskStatusOrder.flatMap((status) => grouped[status]);
}

function createEmptyStatusMap<T>(factory: () => T): Record<TaskStatus, T> {
  return {
    not_started: factory(),
    in_progress: factory(),
    shelved: factory(),
    completed: factory(),
    abandoned: factory()
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildChecklistTree(
  markdown: string,
  fallbackItems: ChecklistItem[] = []
): ChecklistTreeNode[] {
  const roots: ChecklistTreeNode[] = [];
  const stack: ChecklistTreeNode[] = [];

  markdown.split("\n").forEach((line, index) => {
    const match = line.match(/^(\s*)-\s\[( |x|X)\]\s(.+)$/);

    if (!match) {
      return;
    }

    const depth = Math.floor(match[1].length / 2);
    const node: ChecklistTreeNode = {
      id: `preview_${index}`,
      title: match[3].trim(),
      checked: match[2].toLowerCase() === "x",
      depth,
      children: []
    };

    while (stack.length > depth) {
      stack.pop();
    }

    if (depth === 0 || stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack[depth] = node;
  });

  if (roots.length > 0) {
    return roots;
  }

  return fallbackItems.map((item, index) => ({
    id: item.id || `fallback_${index}`,
    title: item.title,
    checked: item.status === "completed",
    depth: 0,
    children: []
  }));
}

function buildChecklistItems(
  markdown: string,
  fallbackItems: ChecklistItem[] = []
): ChecklistItem[] {
  const tree = buildChecklistTree(markdown, fallbackItems);
  const flat: ChecklistItem[] = [];

  const walk = (nodes: ChecklistTreeNode[]) => {
    for (const node of nodes) {
      flat.push({
        id: node.id,
        title: node.title,
        status: node.checked ? "completed" : "not_started"
      });
      walk(node.children);
    }
  };

  walk(tree);
  return flat;
}

function countChecklistTree(nodes: ChecklistTreeNode[]) {
  let count = 0;

  const walk = (items: ChecklistTreeNode[]) => {
    for (const item of items) {
      count += 1;
      walk(item.children);
    }
  };

  walk(nodes);
  return count;
}

function ensureMainTimelineRow(task: TaskRecord, fallbackAt: string): TimelineRow {
  const firstRow = task.timeline[0];
  if (firstRow) {
    return {
      ...firstRow,
      title: task.title,
      segments: firstRow.segments.length > 0
        ? firstRow.segments
        : [{ id: `${firstRow.id}_1`, status: task.status, startAt: fallbackAt, endAt: fallbackAt }]
    };
  }

  return {
    id: `row_${task.id}`,
    title: task.title,
    segments: [{ id: `row_${task.id}_1`, status: task.status, startAt: fallbackAt, endAt: fallbackAt }]
  };
}

function buildTimelineRows(task: TaskRecord): TimelineRow[] {
  const mainRow = ensureMainTimelineRow(task, new Date().toISOString());
  return [
    {
      ...mainRow,
      title: task.title
    }
  ];
}

function normalizeReminder(reminder: ReminderDetail): ReminderDetail {
  const repeatKind = reminder.repeatKind ?? inferRepeatKind(reminder.repeat);
  const dateTime = reminder.dateTime ?? inferDateTime(reminder.at);
  const weekdays = reminder.weekdays ?? inferWeekdays(reminder.repeat);
  const enabled = reminder.enabled ?? Boolean(dateTime || reminder.at);

  return {
    enabled,
    dateTime,
    repeatKind,
    weekdays,
    at: formatReminderAt(dateTime),
    repeat: formatReminderRepeat(repeatKind, weekdays)
  };
}

function formatReminderLabel(reminder: ReminderDetail) {
  const normalized = normalizeReminder(reminder);
  if (!normalized.enabled || !normalized.at) {
    return undefined;
  }

  return normalized.repeat && normalized.repeat !== "不重复"
    ? `${normalized.at} · ${normalized.repeat}`
    : normalized.at;
}

function formatReminderAt(dateTime?: string) {
  if (!dateTime) {
    return "";
  }

  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatReminderRepeat(repeatKind?: ReminderDetail["repeatKind"], weekdays: number[] = []) {
  switch (repeatKind) {
    case "daily":
      return "每天";
    case "weekly":
      return weekdays.length > 0 ? weekdays.map((day) => `周${"日一二三四五六"[day]}`).join(" / ") : "每周";
    default:
      return "不重复";
  }
}

function inferRepeatKind(repeat?: string): ReminderDetail["repeatKind"] {
  if (repeat?.includes("每天")) {
    return "daily";
  }

  if (repeat?.includes("周")) {
    return "weekly";
  }

  return "none";
}

function inferWeekdays(repeat?: string) {
  if (!repeat || !repeat.includes("周")) {
    return [] as number[];
  }

  return Array.from(repeat.matchAll(/周([日一二三四五六])/g)).map((match) => "日一二三四五六".indexOf(match[1]));
}

function inferDateTime(at?: string) {
  if (!at) {
    return "";
  }

  const match = at.match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return "";
  }

  const hours = match[1].padStart(2, "0");
  const minutes = match[2];
  const baseDate = at.includes("明天") ? "2026-07-01" : "2026-06-30";
  return `${baseDate}T${hours}:${minutes}`;
}
