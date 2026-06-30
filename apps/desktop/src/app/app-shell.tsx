import { useEffect, useMemo, useState } from "react";
import { TaskDetailPane } from "../features/details/task-detail-pane";
import { ThemeProvider } from "../features/theme/theme-provider";
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
  const [theme, setTheme] = useState<ThemeName>("olive");
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

  return (
    <ThemeProvider value={theme}>
      <main className={`app-shell theme-${theme}`}>
        <aside className="left-pane">
          <MonthFilter
            title="日历"
            today={APP_TODAY}
            initialSelectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            showWorkspaces
            activeWorkspaceId={selectedWorkspace}
            onSelectWorkspace={setSelectedWorkspace}
          />
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
          onThemeChange={setTheme}
        />
        <section aria-label="details-pane" className="details-pane">
          {selectedTask ? (
            <TaskDetailPane
              task={detail!}
              onCompleteTask={(taskId) => applyTaskChange(taskId, completeTask)}
              onShelveTask={(taskId) => applyTaskChange(taskId, shelveTask)}
              onResumeTask={(taskId) => applyTaskChange(taskId, resumeTask)}
            />
          ) : null}
        </section>
        {undoState ? <UndoToast message={undoState.message} onUndo={undoLastChange} /> : null}
      </main>
    </ThemeProvider>
  );
}
