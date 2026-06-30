import type {
  ChecklistItem,
  ReminderDetail,
  TaskDetail,
  TaskStatus,
  TaskSummary,
  TimelineRow
} from "./types";

export const statusMeta: Record<
  TaskStatus,
  { label: string; chipClass: string; next?: TaskStatus }
> = {
  not_started: { label: "未开始", chipClass: "status-slate", next: "in_progress" },
  in_progress: { label: "进行中", chipClass: "status-amber", next: "completed" },
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
    reminderLabel: task.reminder.at
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
        segments: [{ id: `seg_${Date.now()}_${index}`, status: "not_started", width: "28%" }]
      }
    ]
  };
}

export function advanceTask(task: TaskRecord): TaskRecord {
  const next = statusMeta[task.status].next ?? task.status;
  return applyStatus(task, next);
}

export function completeTask(task: TaskRecord): TaskRecord {
  return applyStatus(task, "completed");
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
                width: status === "completed" ? "24%" : "18%"
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
            { id: "seg_1", status: "not_started", width: "18%" },
            { id: "seg_2", status: "in_progress", width: "40%" }
          ]
        },
        {
          id: "row_child_1",
          title: "子任务 A",
          segments: [
            { id: "seg_3", status: "not_started", width: "12%" },
            { id: "seg_4", status: "completed", width: "24%" }
          ]
        }
      ]
    },
    {
      id: "task_seed_2",
      title: "设计桌面小窗交互",
      status: "in_progress",
      isToday: true,
      reminder: { at: "明天 09:00", repeat: "每天" },
      checklist: [{ id: "check_3", title: "定义小窗按钮状态", status: "not_started" }],
      document: "- [ ] 定义小窗按钮状态",
      timeline: [
        {
          id: "row_main_2",
          title: "主任务",
          segments: [
            { id: "seg_5", status: "not_started", width: "16%" },
            { id: "seg_6", status: "in_progress", width: "36%" }
          ]
        }
      ]
    }
  ];
}
