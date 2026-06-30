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

export type TaskRecord = {
  id: string;
  title: string;
  status: TaskStatus;
  isToday: boolean;
  reminder: ReminderDetail;
  checklist: ChecklistItem[];
  document: string;
  timeline: TimelineRow[];
};

export function buildTaskSummary(task: TaskRecord): TaskSummary {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    isToday: task.isToday,
    reminderLabel: task.reminder.at,
    checklistCount: task.checklist.length,
    checklistTree: buildChecklistTree(task.document, task.checklist)
  };
}

export function buildTaskDetail(task: TaskRecord): TaskDetail {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    document: task.document,
    reminder: task.reminder,
    checklist: task.checklist,
    timeline: {
      rows: task.timeline
    }
  };
}

export function createTaskRecord(title: string, index: number): TaskRecord {
  const base = new Date(2026, 5, 30 + index, 9, 0, 0).toISOString();
  const end = new Date(2026, 5, 30 + index, 18, 0, 0).toISOString();

  return {
    id: `task_${Date.now()}_${index}`,
    title,
    status: "not_started",
    isToday: true,
    reminder: {
      at: "今天 18:00",
      repeat: "每周一 / 每周三 / 每周五"
    },
    checklist: [{ id: `item_${Date.now()}_${index}`, title: `拆解：${title}`, status: "not_started" }],
    document: `- [ ] 拆解：${title}`,
    timeline: [
      {
        id: `row_${Date.now()}_${index}`,
        title,
        segments: [{ id: `seg_${Date.now()}_${index}`, status: "not_started", startAt: base, endAt: end }]
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

export function applyStatus(task: TaskRecord, status: TaskStatus): TaskRecord {
  if (task.status === status) {
    return task;
  }

  return {
    ...task,
    status,
    timeline: task.timeline.map((row) =>
      row.id.startsWith("row_")
        ? {
            ...row,
            segments: [
              ...row.segments,
              {
                id: `${row.id}_${row.segments.length + 1}`,
                status,
                startAt: buildSegmentStart(row.segments, task.id),
                endAt: buildSegmentEnd(row.segments, task.id, status)
              }
            ]
          }
        : row
    )
  };
}

export function seedTasks(): TaskRecord[] {
  return [
    {
      id: "task_seed_1",
      title: "重构任务时间轴存储",
      status: "in_progress",
      isToday: true,
      reminder: { at: "今天 14:00", repeat: "每周一 / 每周三 / 每周五" },
      checklist: [
        { id: "check_1", title: "定义 task_events 表", status: "not_started" },
        { id: "check_2", title: "补状态颜色映射", status: "completed" }
      ],
      document: "- [ ] 定义 task_events 表\n- [x] 补状态颜色映射",
      timeline: [
        {
          id: "row_main_1",
          title: "主任务",
          segments: [
            { id: "seg_1", status: "not_started", startAt: "2026-06-28T09:00:00.000Z", endAt: "2026-06-29T12:00:00.000Z" },
            { id: "seg_2", status: "in_progress", startAt: "2026-06-30T09:00:00.000Z", endAt: "2026-07-03T18:00:00.000Z" }
          ]
        },
        {
          id: "row_child_1",
          title: "子任务 A",
          segments: [
            { id: "seg_3", status: "not_started", startAt: "2026-06-28T09:00:00.000Z", endAt: "2026-06-28T18:00:00.000Z" },
            { id: "seg_4", status: "completed", startAt: "2026-06-29T09:00:00.000Z", endAt: "2026-06-30T16:00:00.000Z" }
          ]
        }
      ]
    },
    {
      id: "task_seed_2",
      title: "设计桌面小窗交互",
      status: "shelved",
      isToday: true,
      reminder: { at: "明天 09:00", repeat: "每天" },
      checklist: [{ id: "check_3", title: "定义小窗按钮状态", status: "not_started" }],
      document: "- [ ] 定义小窗按钮状态",
      timeline: [
        {
          id: "row_main_2",
          title: "主任务",
          segments: [
            { id: "seg_5", status: "not_started", startAt: "2026-06-29T08:00:00.000Z", endAt: "2026-06-29T16:00:00.000Z" },
            { id: "seg_6", status: "in_progress", startAt: "2026-06-30T10:00:00.000Z", endAt: "2026-07-01T12:00:00.000Z" },
            { id: "seg_7", status: "shelved", startAt: "2026-07-01T12:00:00.000Z", endAt: "2026-07-03T17:00:00.000Z" }
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

function buildSegmentStart(segments: TimelineRow["segments"], _seed: string) {
  const lastSegment = segments[segments.length - 1];
  if (lastSegment) {
    return lastSegment.endAt;
  }

  return new Date("2026-06-30T09:00:00.000Z").toISOString();
}

function buildSegmentEnd(
  segments: TimelineRow["segments"],
  seed: string,
  status: TaskStatus
) {
  const startAt = new Date(buildSegmentStart(segments, seed));
  const durationHours = status === "completed" ? 20 : 12;
  startAt.setHours(startAt.getHours() + durationHours);
  return startAt.toISOString();
}
