import type { ExecutionLog, ExecutionLogLevel, ExecutionRun, ExecutionRunStatus, ExecutorItem, TaskItem } from "./types";

ensureBrowserApis();

export function createExecutionLog(input: {
  id: string;
  at: string;
  level: ExecutionLogLevel;
  message: string;
}): ExecutionLog {
  return { ...input };
}

export function createExecutionRun(input: {
  id: string;
  workspaceId: string;
  taskId: string;
  executorId: string;
  trigger: ExecutionRun["trigger"];
  startedAt?: string;
  updatedAt?: string;
  status?: ExecutionRunStatus;
  finishedAt?: string;
  summary?: string;
  error?: string;
  logs?: ExecutionLog[];
}): ExecutionRun {
  return {
    id: input.id,
    workspaceId: input.workspaceId,
    taskId: input.taskId,
    executorId: input.executorId,
    status: input.status ?? "queued",
    trigger: input.trigger,
    startedAt: input.startedAt,
    updatedAt: input.updatedAt ?? input.startedAt ?? input.finishedAt,
    finishedAt: input.finishedAt,
    summary: input.summary,
    error: input.error,
    logs: input.logs ? [...input.logs] : []
  };
}

export function appendExecutionLog(run: ExecutionRun, log: ExecutionLog): ExecutionRun {
  return {
    ...run,
    updatedAt: log.at,
    logs: [...run.logs, log]
  };
}

export function completeExecutionRun(
  run: ExecutionRun,
  outcome: {
    status: "succeeded" | "failed";
    finishedAt: string;
    summary?: string;
    error?: string;
    log?: ExecutionLog;
  }
): ExecutionRun {
  const nextLogs = outcome.log ? [...run.logs, outcome.log] : [...run.logs];

  return {
    ...run,
    status: outcome.status,
    finishedAt: outcome.finishedAt,
    updatedAt: outcome.log?.at ?? outcome.finishedAt,
    summary: outcome.summary ?? run.summary,
    error: outcome.error ?? run.error,
    logs: nextLogs
  };
}

export function collectQueuedRuns(runs: ExecutionRun[]): ExecutionRun[] {
  return runs.filter((run) => run.status === "queued");
}

export function findActiveRun(taskId: string, runs: ExecutionRun[]): ExecutionRun | undefined {
  return [...runs]
    .filter((run) => run.taskId === taskId && (run.status === "queued" || run.status === "running"))
    .sort((left, right) => getRunSortKey(right).localeCompare(getRunSortKey(left)))[0];
}

export function findLatestRun(taskId: string, runs: ExecutionRun[]): ExecutionRun | undefined {
  return [...runs]
    .filter((run) => run.taskId === taskId)
    .sort((left, right) => getRunSortKey(right).localeCompare(getRunSortKey(left)))[0];
}

export function canStartExecution(task: TaskItem, executor?: ExecutorItem): boolean {
  if (!task.assigneeId || !executor) {
    return false;
  }

  if (executor.status === "offline" || executor.status === "error") {
    return false;
  }

  return task.status === "assigned" || task.status === "returned" || task.status === "suspended";
}

export function buildExecutionSummary(task: TaskItem, executor?: ExecutorItem): string {
  const executorName = executor?.name ?? "执行器";
  return `${executorName} 已完成 ${task.title}，等待人工审核。`;
}

export function buildExecutionFailure(task: TaskItem, executor?: ExecutorItem): string {
  const executorName = executor?.name ?? "执行器";
  return `${executorName} 执行 ${task.title} 失败，任务已退回。`;
}

function getRunSortKey(run: ExecutionRun): string {
  return run.finishedAt ?? run.updatedAt ?? run.startedAt ?? run.logs.at(-1)?.at ?? "";
}

function ensureBrowserApis(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!window.localStorage || typeof window.localStorage.clear !== "function") {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createStorageMock()
    });
  }
}

function createStorageMock(): Storage {
  const entries = new Map<string, string>();

  return {
    length: 0,
    clear() {
      entries.clear();
    },
    getItem(key: string) {
      return entries.has(key) ? entries.get(key)! : null;
    },
    key(index: number) {
      return Array.from(entries.keys())[index] ?? null;
    },
    removeItem(key: string) {
      entries.delete(key);
    },
    setItem(key: string, value: string) {
      entries.set(key, value);
    }
  } as Storage;
}
