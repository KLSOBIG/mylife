import React from "react";
import ReactDOM from "react-dom/client";
import { TodayWidget } from "./features/widget/today-widget";
import { completeTask, shelveTask, type TaskRecord } from "./lib/task-state";
import type { WidgetTask } from "./lib/types";
import "./styles/app.css";

const APP_STATE_STORAGE_KEY = "mylife.desktop.app-state.v1";
const PREVIEW_WIDGET_TASKS: WidgetTask[] = [
  { id: "preview_1", title: "整理今天进行中的任务焦点", status: "in_progress" },
  { id: "preview_2", title: "补桌面小窗交互打磨", status: "in_progress" }
];

export function readTodayWidgetTasks(storage?: Storage): WidgetTask[] {
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(APP_STATE_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { tasks?: Array<{ id: string; title: string; status?: string; isToday?: boolean }> };
    if (!Array.isArray(parsed.tasks)) {
      return [];
    }

    return parsed.tasks
      .filter((task) => task.isToday && task.status === "in_progress")
      .map((task) => ({
        id: task.id,
        title: task.title,
        status: "in_progress"
      }));
  } catch {
    return [];
  }
}

function readAppState(storage?: Storage) {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(APP_STATE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { tasks?: TaskRecord[]; selectedTaskId?: string }) : null;
  } catch {
    return null;
  }
}

function writeAppState(storage: Storage, nextState: { tasks: TaskRecord[]; selectedTaskId?: string }) {
  const current = readAppState(storage);
  if (!current) {
    return;
  }

  storage.setItem(
    APP_STATE_STORAGE_KEY,
    JSON.stringify({
      ...current,
      tasks: nextState.tasks,
      selectedTaskId: nextState.selectedTaskId ?? current.selectedTaskId
    })
  );
}

function readAndRender(setTasks: (tasks: WidgetTask[]) => void) {
  if (typeof window === "undefined") {
    setTasks([]);
    return;
  }

  const tasks = readTodayWidgetTasks(window.localStorage);
  setTasks(tasks.length > 0 ? tasks : getPreviewWidgetTasks());
}

function WidgetRoot() {
  const [tasks, setTasks] = React.useState<WidgetTask[]>(() =>
    typeof window === "undefined"
      ? []
      : (() => {
          const currentTasks = readTodayWidgetTasks(window.localStorage);
          return currentTasks.length > 0 ? currentTasks : getPreviewWidgetTasks();
        })()
  );

  React.useEffect(() => {
    function handleStorage() {
      readAndRender(setTasks);
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function updateTask(taskId: string, transformer: (task: TaskRecord) => TaskRecord) {
    if (typeof window === "undefined") {
      return;
    }

    const current = readAppState(window.localStorage);
    if (!current?.tasks) {
      return;
    }

    const nextTasks = current.tasks.map((task) => (task.id === taskId ? transformer(task) : task));
    writeAppState(window.localStorage, {
      tasks: nextTasks,
      selectedTaskId: taskId
    });
    readAndRender(setTasks);
  }

  return (
    <TodayWidget
      tasks={tasks}
      onRefresh={() => readAndRender(setTasks)}
      onCompleteTask={(taskId) => updateTask(taskId, completeTask)}
      onShelveTask={(taskId) => updateTask(taskId, shelveTask)}
      onOpenTask={(taskId) => {
        if (typeof window === "undefined") {
          return;
        }

        const current = readAppState(window.localStorage);
        if (current?.tasks) {
          writeAppState(window.localStorage, {
            tasks: current.tasks,
            selectedTaskId: taskId
          });
        }
        window.location.assign("/");
      }}
      onOpenMain={() => {
        window.location.assign("/");
      }}
    />
  );
}

function getPreviewWidgetTasks() {
  if (typeof window === "undefined") {
    return [];
  }

  const runtimeWindow = window as typeof window & { __TAURI_INTERNALS__?: unknown };
  if (runtimeWindow.__TAURI_INTERNALS__) {
    return [];
  }

  const host = window.location.hostname;
  if (host === "127.0.0.1" || host === "localhost") {
    return PREVIEW_WIDGET_TASKS;
  }

  return [];
}

const widgetRoot = typeof document === "undefined" ? null : document.getElementById("widget-root");

if (widgetRoot) {
  ReactDOM.createRoot(widgetRoot).render(
    <React.StrictMode>
      <WidgetRoot />
    </React.StrictMode>
  );
}
