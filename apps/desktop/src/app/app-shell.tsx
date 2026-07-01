import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
  updateTaskDocument,
  type TaskRecord,
  type ThemeName
} from "../lib/task-state";
import type { TaskMoveRequest } from "../lib/types";
import "../styles/app.css";

const APP_TODAY = new Date(2026, 5, 30, 9, 0, 0);

export function AppShell() {
  const [tasks, setTasks] = useState<TaskRecord[]>(seedTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(seedTasks()[0].id);
  const [selectedDate, setSelectedDate] = useState<Date>(APP_TODAY);
  const [selectedWorkspace, setSelectedWorkspace] = useState("my-work");
  const [draftTitle, setDraftTitle] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeName>("olive");
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(themePresets.olive);
  const [undoState, setUndoState] = useState<{
    message: string;
    previous: TaskRecord[];
  } | null>(null);

  useEffect(() => {
    if (!undoState) {
      return;
    }

    const timer = window.setTimeout(() => {
      setUndoState(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [undoState]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? tasks[0],
    [selectedTaskId, tasks]
  );

  const summaries = tasks.map(buildTaskSummary);
  const detail = selectedTask ? buildTaskDetail(selectedTask) : null;

  function openComposer() {
    setIsComposerOpen(true);
  }

  function applyThemePreset(nextTheme: ThemeName) {
    setTheme(nextTheme);
    setThemeSettings(themePresets[nextTheme]);
  }

  function saveTask() {
    if (!draftTitle.trim()) {
      return;
    }

    const nextTask = createTaskRecord(draftTitle.trim(), tasks.length);
    const nextTasks = [nextTask, ...tasks];
    setTasks(nextTasks);
    setSelectedTaskId(nextTask.id);
    setDraftTitle("");
    setIsComposerOpen(false);
  }

  function commitTasks(nextTasks: TaskRecord[], message: string) {
    const previous = tasks;
    setTasks(nextTasks);
    setUndoState({
      message,
      previous
    });
  }

  function applyTaskChange(taskId: string, transformer: (task: TaskRecord) => TaskRecord) {
    const previous = tasks;
    const nextTasks = tasks.map((task) => (task.id === taskId ? transformer(task) : task));
    const changed = nextTasks.find((task) => task.id === taskId);
    setTasks(nextTasks);
    if (changed) {
      setUndoState({
        message: `任务已切换到 ${statusMeta[changed.status].label}`,
        previous
      });
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

  function undoLastChange() {
    if (!undoState) {
      return;
    }
    setTasks(undoState.previous);
    setUndoState(null);
  }

  function applyDocumentChange(taskId: string, document: string) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? updateTaskDocument(task, document) : task))
    );
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
            />
          ) : null}
        </section>
        {undoState ? <UndoToast message={undoState.message} onUndo={undoLastChange} /> : null}
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
