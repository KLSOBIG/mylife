import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { TaskDetailPane } from "../features/details/task-detail-pane";
import { ThemeProvider } from "../features/theme/theme-provider";
import { SettingsPanel, type ThemeSettings } from "../features/theme/settings-panel";
import { MonthFilter } from "../features/calendar/month-filter";
import { UndoToast } from "../features/tasks/undo-toast";
import { TodayBoard } from "../features/tasks/today-board";
import {
  buildTaskDetail,
  buildTaskSummary,
  completeTask,
  createTaskRecord,
  moveTaskRecords,
  resumeTask,
  seedTasks,
  shelveTask,
  statusMeta,
  themePresets,
  updateTaskReminder,
  updateTaskDocument,
  workspaceOptions,
  type TaskRecord,
  type ThemeName
} from "../lib/task-state";
import type { ReminderDetail, TaskMoveRequest } from "../lib/types";
import "../styles/app.css";

const APP_TODAY = new Date(2026, 5, 30, 9, 0, 0);
const APP_STATE_STORAGE_KEY = "mylife.desktop.app-state.v1";

type AppStateSnapshot = {
  tasks: TaskRecord[];
  selectedTaskId: string;
  selectedDate: string;
  selectedWorkspace: string;
  theme: ThemeName;
  themeSettings: ThemeSettings;
};

export function AppShell() {
  const initialState = useMemo(readInitialAppState, []);
  const [tasks, setTasks] = useState<TaskRecord[]>(initialState.tasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(initialState.selectedTaskId);
  const [selectedDate, setSelectedDate] = useState<Date>(initialState.selectedDate);
  const [selectedWorkspace, setSelectedWorkspace] = useState(initialState.selectedWorkspace);
  const [draftTitle, setDraftTitle] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeName>(initialState.theme);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(initialState.themeSettings);
  const [undoQueue, setUndoQueue] = useState<Array<{
    id: string;
    message: string;
    previous: TaskRecord[];
  }>>([]);
  const [reminderAlerts, setReminderAlerts] = useState<Array<{
    id: string;
    taskId: string;
    title: string;
    scheduledAt: string;
  }>>([]);
  const seenReminderKeysRef = useRef(new Set<string>());

  useEffect(() => {
    if (undoQueue.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setUndoQueue((current) => current.slice(1));
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [undoQueue]);

  useEffect(() => {
    writeAppState({
      tasks,
      selectedTaskId,
      selectedDate: selectedDate.toISOString(),
      selectedWorkspace,
      theme,
      themeSettings
    });
  }, [selectedDate, selectedTaskId, selectedWorkspace, tasks, theme, themeSettings]);

  useEffect(() => {
    function collectDueReminders() {
      const now = Date.now();
      const dueAlerts = tasks.flatMap((task) => {
        if (task.status === "completed" || task.status === "abandoned") {
          return [];
        }

        const dateTime = task.reminder.dateTime;
        if (!task.reminder.enabled || !dateTime) {
          return [];
        }

        const scheduledAt = Date.parse(dateTime);
        const reminderKey = `${task.id}:${dateTime}`;
        if (Number.isNaN(scheduledAt) || scheduledAt > now || now - scheduledAt > 5 * 60_000) {
          return [];
        }

        if (
          seenReminderKeysRef.current.has(reminderKey) ||
          reminderAlerts.some((alert) => alert.id === reminderKey)
        ) {
          return [];
        }

        return [
          {
            id: reminderKey,
            taskId: task.id,
            title: task.title,
            scheduledAt: task.reminder.at || dateTime
          }
        ];
      });

      if (dueAlerts.length > 0) {
        setReminderAlerts((current) => [...current, ...dueAlerts]);
      }
    }

    collectDueReminders();
    const timer = window.setInterval(collectDueReminders, 30_000);
    return () => window.clearInterval(timer);
  }, [reminderAlerts, tasks]);

  const filteredTasks = useMemo(
    () => tasks.filter((task) => task.workspaceId === selectedWorkspace),
    [selectedWorkspace, tasks]
  );

  useEffect(() => {
    if (filteredTasks.length === 0) {
      return;
    }

    if (!filteredTasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(filteredTasks[0].id);
    }
  }, [filteredTasks, selectedTaskId]);

  const selectedTask = useMemo(
    () => filteredTasks.find((task) => task.id === selectedTaskId) ?? filteredTasks[0] ?? null,
    [filteredTasks, selectedTaskId]
  );

  const summaries = filteredTasks.map(buildTaskSummary);
  const detail = selectedTask ? buildTaskDetail(selectedTask) : null;

  function openComposer() {
    setIsComposerOpen(true);
  }

  function applyThemePreset(nextTheme: ThemeName) {
    setTheme(nextTheme);
    setThemeSettings(themePresets[nextTheme]);
  }

  function openWidgetWindow() {
    if (typeof window === "undefined") {
      return;
    }

    window.open("/widget.html", "mylife-widget", "popup=yes,width=420,height=620");
  }

  function saveTask() {
    if (!draftTitle.trim()) {
      setDraftTitle("");
      setIsComposerOpen(false);
      return;
    }

    const nextTask = createTaskRecord(draftTitle.trim(), tasks.length, selectedWorkspace);
    const nextTasks = [nextTask, ...tasks];
    setTasks(nextTasks);
    setSelectedTaskId(nextTask.id);
    setDraftTitle("");
    setIsComposerOpen(false);
  }

  function pushUndo(message: string, previous: TaskRecord[]) {
    setUndoQueue((current) => [
      ...current,
      {
        id: `undo_${Date.now()}_${current.length}`,
        message,
        previous
      }
    ]);
  }

  function commitTasks(nextTasks: TaskRecord[], message: string) {
    const previous = tasks;
    setTasks(nextTasks);
    pushUndo(message, previous);
  }

  function applyTaskChange(taskId: string, transformer: (task: TaskRecord) => TaskRecord) {
    const previous = tasks;
    const nextTasks = tasks.map((task) => (task.id === taskId ? transformer(task) : task));
    const changed = nextTasks.find((task) => task.id === taskId);
    setTasks(nextTasks);
    if (changed) {
      pushUndo(`任务已切换到 ${statusMeta[changed.status].label}`, previous);
    }
  }

  function applyTaskMove(request: TaskMoveRequest) {
    const nextTasks = moveTaskRecords(tasks, request);
    const moved = nextTasks.find((task) => task.id === request.taskId);
    if (!moved) {
      return;
    }

    commitTasks(nextTasks, `任务已拖动到 ${statusMeta[moved.status].label}`);
  }

  function undoChange(undoId: string) {
    const targetIndex = undoQueue.findIndex((item) => item.id === undoId);
    if (targetIndex === -1) {
      return;
    }
    const target = undoQueue[targetIndex];
    setTasks(target.previous);
    setUndoQueue((current) => current.slice(0, targetIndex));
  }

  function applyDocumentChange(taskId: string, document: string) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? updateTaskDocument(task, document) : task))
    );
  }

  function applyReminderChange(taskId: string, reminder: ReminderDetail) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? updateTaskReminder(task, reminder) : task))
    );
  }

  function dismissReminder(alertId: string) {
    seenReminderKeysRef.current.add(alertId);
    setReminderAlerts((current) => current.filter((item) => item.id !== alertId));
  }

  function openReminderTask(alertId: string, taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (task) {
      setSelectedWorkspace(task.workspaceId);
      setSelectedTaskId(task.id);
    }
    dismissReminder(alertId);
  }

  const themeStyle = buildThemeStyle(themeSettings);

  return (
    <ThemeProvider value={theme}>
      <main className={`app-shell theme-${theme}`} style={themeStyle}>
        <aside className="left-pane">
          <div className="left-pane__body">
            <MonthFilter
              title="日历"
              today={APP_TODAY}
              initialSelectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              showWorkspaces
              activeWorkspaceId={selectedWorkspace}
              onSelectWorkspace={setSelectedWorkspace}
              workspaces={[...workspaceOptions]}
            />
          </div>
          <div className="left-pane__footer">
            <SettingsPanel
              open={settingsOpen}
              preset={theme}
              settings={themeSettings}
              onToggle={() => setSettingsOpen((current) => !current)}
              onPresetChange={applyThemePreset}
              onSettingsChange={setThemeSettings}
              onOpenWidget={openWidgetWindow}
            />
          </div>
        </aside>
        <TodayBoard
          tasks={summaries}
          draftTitle={draftTitle}
          isComposerOpen={isComposerOpen}
          onDraftTitleChange={setDraftTitle}
          onCreateClick={openComposer}
          onCreateSave={saveTask}
          onSelectTask={setSelectedTaskId}
          onCompleteTask={(taskId) => applyTaskChange(taskId, completeTask)}
          onShelveTask={(taskId) => applyTaskChange(taskId, shelveTask)}
          onResumeTask={(taskId) => applyTaskChange(taskId, resumeTask)}
          onTaskMove={applyTaskMove}
        />
        <section aria-label="details-pane" className="details-pane">
          {selectedTask ? (
            <TaskDetailPane
              task={detail!}
              onCompleteTask={(taskId) => applyTaskChange(taskId, completeTask)}
              onShelveTask={(taskId) => applyTaskChange(taskId, shelveTask)}
              onResumeTask={(taskId) => applyTaskChange(taskId, resumeTask)}
              onDocumentChange={applyDocumentChange}
              onReminderChange={applyReminderChange}
            />
          ) : (
            <section className="details-pane__empty">当前工作空间暂无任务</section>
          )}
        </section>
        <div className="undo-toast-stack" aria-live="polite" aria-atomic="false">
          {undoQueue.map((item) => (
            <UndoToast key={item.id} message={item.message} onUndo={() => undoChange(item.id)} />
          ))}
        </div>
        <div className="reminder-alert-stack" aria-live="polite" aria-atomic="false">
          {reminderAlerts.map((alert) => (
            <aside key={alert.id} role="status" className="reminder-alert">
              <div className="reminder-alert__title">提醒到点</div>
              <div className="reminder-alert__body">
                <strong>{alert.title}</strong>
                <span>{alert.scheduledAt}</span>
              </div>
              <div className="reminder-alert__actions">
                <button type="button" onClick={() => openReminderTask(alert.id, alert.taskId)}>
                  打开任务
                </button>
                <button type="button" onClick={() => dismissReminder(alert.id)}>
                  忽略
                </button>
              </div>
            </aside>
          ))}
        </div>
      </main>
    </ThemeProvider>
  );
}

function buildThemeStyle(settings: ThemeSettings) {
  const background = settings.backgroundColor;
  const accent = settings.accentColor;
  const sidebar = mixHex(background, "#ffffff", 0.22);
  const hover = mixHex(background, "#000000", 0.06);
  const soft = withAlpha(accent, 0.14);
  const todaySoft = withAlpha(accent, 0.18);

  return {
    "--bg-app": background,
    "--bg-sidebar": sidebar,
    "--bg-hover": hover,
    "--accent": accent,
    "--accent-soft": soft,
    "--today-accent": accent,
    "--today-accent-soft": todaySoft
  } as CSSProperties;
}

function readInitialAppState() {
  const fallbackTasks = seedTasks();
  const fallback: {
    tasks: TaskRecord[];
    selectedTaskId: string;
    selectedDate: Date;
    selectedWorkspace: string;
    theme: ThemeName;
    themeSettings: ThemeSettings;
  } = {
    tasks: fallbackTasks,
    selectedTaskId: fallbackTasks[0]?.id ?? "",
    selectedDate: APP_TODAY,
    selectedWorkspace: "my-work",
    theme: "olive",
    themeSettings: themePresets.olive
  };

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<AppStateSnapshot>;
    const nextTasks =
      Array.isArray(parsed.tasks) && parsed.tasks.length > 0
        ? parsed.tasks.map((task, index) => normalizeTaskRecord(task, index))
        : fallback.tasks;
    const nextTheme = isThemeName(parsed.theme) ? parsed.theme : fallback.theme;

    return {
      tasks: nextTasks,
      selectedTaskId:
        typeof parsed.selectedTaskId === "string" && nextTasks.some((task) => task.id === parsed.selectedTaskId)
          ? parsed.selectedTaskId
          : nextTasks[0]?.id ?? fallback.selectedTaskId,
      selectedDate:
        typeof parsed.selectedDate === "string" && !Number.isNaN(Date.parse(parsed.selectedDate))
          ? new Date(parsed.selectedDate)
          : fallback.selectedDate,
      selectedWorkspace:
        typeof parsed.selectedWorkspace === "string" ? parsed.selectedWorkspace : fallback.selectedWorkspace,
      theme: nextTheme,
      themeSettings: isThemeSettings(parsed.themeSettings) ? parsed.themeSettings : themePresets[nextTheme]
    };
  } catch {
    return fallback;
  }
}

function normalizeTaskRecord(task: TaskRecord, index: number): TaskRecord {
  return {
    ...task,
    workspaceId: task.workspaceId || workspaceOptions[index % workspaceOptions.length].id,
    reminder: {
      enabled: task.reminder?.enabled ?? Boolean(task.reminder?.dateTime || task.reminder?.at),
      dateTime: task.reminder?.dateTime ?? "",
      repeatKind: task.reminder?.repeatKind ?? "none",
      weekdays: task.reminder?.weekdays ?? [],
      at: task.reminder?.at,
      repeat: task.reminder?.repeat
    },
    timeline:
      task.timeline && task.timeline.length > 0
        ? task.timeline.map((row, rowIndex) => ({
            ...row,
            id: row.id || `row_${task.id}_${rowIndex}`,
            title: task.title,
            segments: row.segments
              .filter((segment) => segment.startAt && segment.endAt)
              .map((segment, segmentIndex) => ({
                ...segment,
                id: segment.id || `seg_${task.id}_${segmentIndex}`
              }))
          }))
        : [
            {
              id: `row_${task.id}`,
              title: task.title,
              segments: [
                {
                  id: `row_${task.id}_1`,
                  status: task.status,
                  startAt: new Date().toISOString(),
                  endAt: new Date().toISOString()
                }
              ]
            }
          ]
  };
}

function writeAppState(snapshot: AppStateSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(snapshot));
}

function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && value in themePresets;
}

function isThemeSettings(value: unknown): value is ThemeSettings {
  return Boolean(
    value &&
      typeof value === "object" &&
      "accentColor" in value &&
      typeof (value as ThemeSettings).accentColor === "string" &&
      "backgroundColor" in value &&
      typeof (value as ThemeSettings).backgroundColor === "string"
  );
}

function mixHex(base: string, target: string, weight: number) {
  const left = hexToRgb(base);
  const right = hexToRgb(target);
  const mixed = {
    r: Math.round(left.r + (right.r - left.r) * weight),
    g: Math.round(left.g + (right.g - left.g) * weight),
    b: Math.round(left.b + (right.b - left.b) * weight)
  };

  return rgbToHex(mixed.r, mixed.g, mixed.b);
}

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}
