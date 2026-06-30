import { useEffect, useMemo, useState } from "react";
import { TaskDetailPane } from "../features/details/task-detail-pane";
import { ThemeProvider } from "../features/theme/theme-provider";
import { MonthFilter } from "../features/calendar/month-filter";
import { UndoToast } from "../features/tasks/undo-toast";
import { TodayBoard } from "../features/tasks/today-board";
import { WorkspaceList } from "../features/workspaces/workspace-list";
import {
  advanceTask,
  buildTaskDetail,
  buildTaskSummary,
  completeTask,
  createTaskRecord,
  seedTasks,
  statusMeta,
  type TaskRecord,
  type ThemeName
} from "../lib/task-state";
import "../styles/app.css";

export function AppShell() {
  const [tasks, setTasks] = useState<TaskRecord[]>(seedTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(seedTasks()[0].id);
  const [draftTitle, setDraftTitle] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "gantt">("details");
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
          <MonthFilter />
          <WorkspaceList />
        </aside>
        <TodayBoard
          tasks={summaries}
          draftTitle={draftTitle}
          isComposerOpen={isComposerOpen}
          onDraftTitleChange={setDraftTitle}
          onCreateClick={openComposer}
          onCreateSave={saveTask}
          onSelectTask={(taskId) => {
            setSelectedTaskId(taskId);
            setActiveTab("details");
          }}
          onCompleteTask={(taskId) => applyTaskChange(taskId, completeTask)}
          onThemeChange={setTheme}
        />
        <section aria-label="details-pane" className="details-pane">
          <div className="details-pane__actions">
            <button type="button" onClick={() => setActiveTab("details")}>
              任务详情
            </button>
            <button type="button" onClick={() => setActiveTab("gantt")}>
              甘特图
            </button>
          </div>
          {selectedTask && activeTab === "details" ? (
            <>
              <div className="details-pane__task-actions">
                <button type="button" onClick={() => applyTaskChange(selectedTask.id, completeTask)}>
                  完成
                </button>
                <button type="button" onClick={() => applyTaskChange(selectedTask.id, advanceTask)}>
                  下一状态
                </button>
              </div>
              <TaskDetailPane task={detail!} activeTab="details" />
            </>
          ) : null}
          {selectedTask && activeTab === "gantt" ? (
            <TaskDetailPane task={detail!} activeTab="gantt" />
          ) : null}
        </section>
        {undoState ? <UndoToast message={undoState.message} onUndo={undoLastChange} /> : null}
      </main>
    </ThemeProvider>
  );
}
