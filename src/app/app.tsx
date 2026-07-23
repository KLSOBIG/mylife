import { useEffect, useMemo, useReducer, useRef } from "react";
import {
  buildExecutionFailure,
  buildExecutionSummary,
  canStartExecution,
  collectQueuedRuns,
  createExecutionLog,
  createExecutionRun,
  findActiveRun,
  findLatestRun
} from "../domain/execution-runtime";
import { chartSeries } from "../domain/mock-data";
import { parseIntent } from "../domain/intents";
import { loadAppModel, saveAppModel } from "../domain/persistence";
import {
  createEventFromDraft,
  createRuleFromDraft,
  createRuleFromSuggestion,
  createSourceFromDraft,
  createTaskFromDraft,
  createTaskFromIntent,
  createWorkspaceFromDraft,
  reduceModel
} from "../domain/store";
import type { AttentionLevel, ExecutionRun, ExecutorItem, ExecutorStatus, PageId, Workspace } from "../domain/types";
import { DashboardPage } from "../features/dashboard/dashboard-page";
import { EventsPage } from "../features/events/events-page";
import { ExecutorsPage } from "../features/executors/executors-page";
import { RulesPage } from "../features/rules/rules-page";
import { SourcesPage } from "../features/sources/sources-page";
import { TasksPage } from "../features/tasks/tasks-page";
import { ChatPanel } from "./layout/chat-panel";
import { DetailPanel } from "./layout/detail-panel";
import { Header } from "./layout/header";
import { Sidebar } from "./layout/sidebar";

const pageByDigit: Record<string, PageId> = {
  "1": "dashboard",
  "2": "events",
  "3": "tasks",
  "4": "executors",
  "5": "rules",
  "6": "sources"
};

export function App() {
  const [model, dispatch] = useReducer(reduceModel, undefined, () => loadAppModel(getStorage()));
  const { data, state } = model;
  const queuedTimers = useRef(new Set<string>());

  useEffect(() => {
    saveAppModel(model, getStorage());
  }, [model]);

  useEffect(() => {
    const queuedRuns = collectQueuedRuns(data.executionRuns);
    queuedRuns.forEach((run: ExecutionRun) => {
      if (queuedTimers.current.has(run.id)) {
        return;
      }

      queuedTimers.current.add(run.id);
      window.setTimeout(() => {
        queuedTimers.current.delete(run.id);
        dispatch({
          type: "task/executionRunning",
          taskId: run.taskId,
          runId: run.id,
          log: createExecutionLog({
            id: createRuntimeId("log"),
            at: formatNow(),
            level: "info",
            message: "执行器已领取任务，开始运行。"
          })
        });
      }, 250);
    });
  }, [data.executionRuns]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inTyping = Boolean(target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        dispatch({ type: "commandPalette/openChanged", open: true });
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        dispatch({ type: "chat/toggled" });
        return;
      }

      if (event.key === "Escape") {
        dispatch({ type: "commandPalette/openChanged", open: false });
        dispatch({ type: "event/selected", eventId: undefined });
        dispatch({ type: "task/selected", taskId: undefined });
        dispatch({ type: "chat/openChanged", open: false });
        return;
      }

      if (inTyping) {
        return;
      }

      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        const task = createTaskFromIntent(state.currentWorkspaceId, "未命名任务", "medium");
        dispatch({
          type: "chat/messageSubmitted",
          message: "新建任务",
          reply: `已创建任务：${task.title}`
        });
        dispatch({ type: "task/created", task });
        return;
      }

      const page = pageByDigit[event.key];
      if (page) {
        event.preventDefault();
        dispatch({ type: "page/switched", page });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.currentWorkspaceId]);

  const currentWorkspace = data.workspaces.find((item) => item.id === state.currentWorkspaceId) ?? data.workspaces[0];
  const filteredEvents = useMemo(
    () =>
      data.events.filter((item) => {
        if (item.workspaceId !== state.currentWorkspaceId) {
          return false;
        }
        if (state.eventFilter !== "all" && item.level !== state.eventFilter) {
          return false;
        }
        if (state.eventSourceFilter !== "all" && item.source !== state.eventSourceFilter) {
          return false;
        }
        if (!state.eventQuery.trim()) {
          return true;
        }
        const haystack = [item.title, item.source, item.sender, item.summary, item.tags.join(" ")]
          .join(" ")
          .toLowerCase();
        return haystack.includes(state.eventQuery.trim().toLowerCase());
      }),
    [data.events, state.currentWorkspaceId, state.eventFilter, state.eventQuery, state.eventSourceFilter]
  );
  const filteredTasks = useMemo(
    () => data.tasks.filter((item) => item.workspaceId === state.currentWorkspaceId),
    [data.tasks, state.currentWorkspaceId]
  );
  const filteredExecutors = useMemo(
    () => deriveExecutorMetrics(
      data.executors.filter((item) => item.workspaceId === state.currentWorkspaceId),
      data.executionRuns.filter((item) => item.workspaceId === state.currentWorkspaceId)
    ),
    [data.executors, data.executionRuns, state.currentWorkspaceId]
  );
  const filteredExecutionRuns = useMemo(
    () => data.executionRuns.filter((item) => item.workspaceId === state.currentWorkspaceId),
    [data.executionRuns, state.currentWorkspaceId]
  );
  const filteredRules = useMemo(
    () => data.rules.filter((item) => item.workspaceId === state.currentWorkspaceId),
    [data.rules, state.currentWorkspaceId]
  );
  const filteredSuggestions = useMemo(
    () => data.ruleSuggestions.filter((item) => item.workspaceId === state.currentWorkspaceId),
    [data.ruleSuggestions, state.currentWorkspaceId]
  );
  const filteredSources = useMemo(
    () => data.sources.filter((item) => item.workspaceId === state.currentWorkspaceId),
    [data.sources, state.currentWorkspaceId]
  );

  const selectedEvent = findById(filteredEvents, state.selectedEventId);
  const selectedTask = findById(filteredTasks, state.selectedTaskId);
  const selectedTaskRuns = selectedTask
    ? filteredExecutionRuns
        .filter((item) => item.taskId === selectedTask.id)
        .sort((left, right) => getRunSortKey(right).localeCompare(getRunSortKey(left)))
    : [];
  const activeRun = selectedTask ? findActiveRun(selectedTask.id, filteredExecutionRuns) : undefined;
  const latestRun = selectedTask ? findLatestRun(selectedTask.id, filteredExecutionRuns) : undefined;
  const selectedExecutor = selectedTask?.assigneeId
    ? filteredExecutors.find((item) => item.id === selectedTask.assigneeId)
    : undefined;
  const executionStats = deriveExecutionStats(filteredExecutionRuns);
  if (!currentWorkspace) {
    return null;
  }

  return (
    <div className="app-shell">
      <Sidebar
        currentPage={state.currentPage}
        currentWorkspaceId={state.currentWorkspaceId}
        workspaces={data.workspaces}
        onPageChange={(page) => dispatch({ type: "page/switched", page })}
        onWorkspaceChange={(workspaceId) => dispatch({ type: "workspace/switched", workspaceId })}
        onCreateWorkspace={(draft) => {
          const workspace = createWorkspaceFromDraft(draft);
          dispatch({ type: "workspace/created", workspace });
          dispatch({
            type: "chat/messageSubmitted",
            message: `创建工作空间 ${workspace.name}`,
            reply: `已切换到 ${workspace.name}。`
          });
        }}
      />

      <div className="main-shell">
        <Header
          currentPage={state.currentPage}
          currentWorkspace={currentWorkspace}
          chatOpen={state.chatOpen}
          commandPaletteOpen={state.commandPaletteOpen}
          onCommandPaletteOpenChange={(open) => dispatch({ type: "commandPalette/openChanged", open })}
          onNavigatePage={(page) => dispatch({ type: "page/switched", page })}
          onCreateTask={() => handleCreateTask()}
          onToggleChat={() => dispatch({ type: "chat/toggled" })}
        />

        <section className="page-shell">
          {state.currentPage === "dashboard" ? (
            <DashboardPage
              workspace={currentWorkspace}
              events={filteredEvents}
              executors={filteredExecutors}
              executionStats={executionStats}
              chartSeries={chartSeries}
            />
          ) : null}

          {state.currentPage === "events" ? (
            <EventsPage
              events={filteredEvents}
              selectedEventId={state.selectedEventId}
              activeFilter={state.eventFilter}
              sourceFilter={state.eventSourceFilter}
              searchQuery={state.eventQuery}
              onSelect={(eventId) => dispatch({ type: "event/selected", eventId })}
              onFilterChange={(filter) => dispatch({ type: "events/filterChanged", filter })}
              onSourceFilterChange={(source) => dispatch({ type: "events/sourceFilterChanged", source })}
              onSearchChange={(query) => dispatch({ type: "events/queryChanged", query })}
              onCreate={(draft) => {
                const event = createEventFromDraft(state.currentWorkspaceId, draft);
                dispatch({ type: "event/created", event });
              }}
            />
          ) : null}

          {state.currentPage === "tasks" ? (
            <TasksPage
              tasks={filteredTasks}
              selectedTaskId={state.selectedTaskId}
              viewMode={state.taskView}
              onSelect={(taskId) => dispatch({ type: "task/selected", taskId })}
              onViewModeChange={(view) => dispatch({ type: "task/viewChanged", view })}
              onStatusChange={(taskId, status) => dispatch({ type: "task/statusChanged", taskId, status })}
              onCreate={(draft) => {
                const task = createTaskFromDraft(state.currentWorkspaceId, draft);
                dispatch({ type: "task/created", task });
              }}
            />
          ) : null}

          {state.currentPage === "executors" ? <ExecutorsPage executors={filteredExecutors} /> : null}

          {state.currentPage === "rules" ? (
            <RulesPage
              rules={filteredRules}
              suggestedRules={filteredSuggestions.map((item) => ({
                name: item.title,
                description: item.description,
                level: "L1" as AttentionLevel,
                condition: item.condition,
                action: item.action
              }))}
              onToggleRule={(ruleId, nextEnabled) => dispatch({ type: "rule/toggled", ruleId, enabled: nextEnabled })}
              onCreateRule={(draft) => {
                const rule = createRuleFromDraft(state.currentWorkspaceId, draft);
                dispatch({ type: "rule/created", rule });
              }}
              onApplySuggestion={(index) => {
                const suggestion = filteredSuggestions[index];
                if (!suggestion) {
                  return;
                }
                const rule = createRuleFromSuggestion(state.currentWorkspaceId, suggestion);
                dispatch({ type: "rule/suggestionApplied", suggestion, rule });
              }}
            />
          ) : null}

          {state.currentPage === "sources" ? (
            <SourcesPage
              sources={filteredSources}
              onToggleSource={(sourceId, nextStatus) =>
                dispatch({
                  type: "source/toggled",
                  sourceId,
                  status: nextStatus,
                  enabled: nextStatus !== "offline"
                })
              }
              onCreateSource={(draft) => {
                const source = createSourceFromDraft(state.currentWorkspaceId, draft);
                dispatch({ type: "source/created", source });
              }}
            />
          ) : null}
        </section>
      </div>

      <DetailPanel
        event={selectedEvent}
        executors={filteredExecutors}
        task={selectedTask}
        activeRun={activeRun}
        latestRun={latestRun}
        runs={selectedTaskRuns}
        onConvertEventToTask={() => {
          if (!selectedEvent) {
            return;
          }
          const task = createTaskFromDraft(state.currentWorkspaceId, {
            title: selectedEvent.title,
            description: selectedEvent.summary,
            type: "event",
            priority: selectedEvent.level === "L3" ? "urgent" : selectedEvent.level === "L2" ? "high" : "medium",
            level: selectedEvent.level,
            status: "pending_assignment"
          });
          dispatch({ type: "event/convertedToTask", eventId: selectedEvent.id, task });
        }}
        onTaskStatusChange={(status) => {
          if (!selectedTask) {
            return;
          }
          dispatch({ type: "task/statusChanged", taskId: selectedTask.id, status });
        }}
        onTaskAssigneeChange={(assigneeId) => {
          if (!selectedTask) {
            return;
          }
          dispatch({ type: "task/assigneeChanged", taskId: selectedTask.id, assigneeId });
        }}
        onTaskExecutionFailure={() => {
          if (!selectedTask || !activeRun) {
            return;
          }
          const error = buildExecutionFailure(selectedTask, selectedExecutor);
          const log = createExecutionLog({
            id: createRuntimeId("log"),
            at: formatNow(),
            level: "error",
            message: error
          });
          dispatch({
            type: "task/executionFailed",
            taskId: selectedTask.id,
            runId: activeRun.id,
            error,
            finishedAt: log.at,
            log
          });
        }}
        onTaskExecutionRetry={() => {
          if (!selectedTask?.assigneeId) {
            return;
          }
          dispatch({
            type: "task/executionStarted",
            run: createExecutionRun({
              id: createRuntimeId("run"),
              workspaceId: selectedTask.workspaceId,
              taskId: selectedTask.id,
              executorId: selectedTask.assigneeId,
              trigger: "manual",
              logs: [
                createExecutionLog({
                  id: createRuntimeId("log"),
                  at: formatNow(),
                  level: "info",
                  message: "任务已派发，等待执行器领取。"
                })
              ]
            })
          });
        }}
        onTaskExecutionStart={() => {
          if (!selectedTask?.assigneeId || !canStartExecution(selectedTask, selectedExecutor)) {
            return;
          }
          dispatch({
            type: "task/executionStarted",
            run: createExecutionRun({
              id: createRuntimeId("run"),
              workspaceId: selectedTask.workspaceId,
              taskId: selectedTask.id,
              executorId: selectedTask.assigneeId,
              trigger: "manual",
              logs: [
                createExecutionLog({
                  id: createRuntimeId("log"),
                  at: formatNow(),
                  level: "info",
                  message: "任务已派发，等待执行器领取。"
                })
              ]
            })
          });
        }}
        onTaskExecutionSuccess={() => {
          if (!selectedTask || !activeRun) {
            return;
          }
          const summary = buildExecutionSummary(selectedTask, selectedExecutor);
          const log = createExecutionLog({
            id: createRuntimeId("log"),
            at: formatNow(),
            level: "success",
            message: summary
          });
          dispatch({
            type: "task/executionSucceeded",
            taskId: selectedTask.id,
            runId: activeRun.id,
            finishedAt: log.at,
            summary,
            log
          });
        }}
      />

      <ChatPanel
        open={state.chatOpen}
        pinned={state.chatPinned}
        mode={state.chatMode}
        messages={data.chatMessages}
        onClose={() => dispatch({ type: "chat/openChanged", open: false })}
        onModeChange={(mode) => dispatch({ type: "chat/modeChanged", mode })}
        onSubmit={(message) => {
          const intent = parseIntent(message);
          const reply = buildReply(intent, currentWorkspace.name);
          dispatch({ type: "chat/messageSubmitted", message, reply });

          if (intent.kind === "create-task") {
            const task = createTaskFromIntent(state.currentWorkspaceId, intent.title, intent.priority);
            dispatch({ type: "task/created", task });
            return;
          }

          if (intent.kind === "switch-page") {
            dispatch({ type: "page/switched", page: intent.page });
            return;
          }

          if (intent.kind === "create-rule") {
            const rule = createRuleFromDraft(state.currentWorkspaceId, {
              name: intent.title,
              description: `来自对话入口：${intent.conditionHint}`,
              level: "L2",
              condition: intent.conditionHint,
              action: intent.title
            });
            dispatch({ type: "rule/created", rule });
          }
        }}
        onTogglePinned={() => dispatch({ type: "chat/pinnedToggled" })}
      />
    </div>
  );
  function handleCreateTask() {
    const task = createTaskFromIntent(state.currentWorkspaceId, "新任务", "high");
    dispatch({ type: "task/created", task });
    dispatch({
      type: "chat/messageSubmitted",
      message: "创建任务",
      reply: `已创建任务：${task.title}`
    });
  }
}

function deriveExecutorMetrics(executors: ExecutorItem[], runs: ExecutionRun[]): ExecutorItem[] {
  return executors.map((executor) => {
    const executorRuns = runs.filter((item) => item.executorId === executor.id);
    const queueCount = executorRuns.filter((item) => item.status === "queued").length;
    const runningCount = executorRuns.filter((item) => item.status === "running").length;
    const completedToday = executorRuns.filter((item) => item.status === "succeeded").length;
    const failureCount = executorRuns.filter((item) => item.status === "failed").length;
    const latestRun = [...executorRuns].sort((left, right) => getRunSortKey(right).localeCompare(getRunSortKey(left)))[0];

    return {
      ...executor,
      activeTasks: runningCount,
      completedToday,
      queueCount,
      runningCount,
      failureCount,
      lastRunSummary: latestRun?.summary ?? latestRun?.error,
      status: deriveExecutorStatus(executor.status, queueCount + runningCount)
    };
  });
}

function deriveExecutorStatus(current: ExecutorStatus, activeTasks: number): ExecutorStatus {
  if (current === "offline" || current === "error") {
    return current;
  }

  return activeTasks > 0 ? "busy" : "idle";
}

function deriveExecutionStats(runs: ExecutionRun[]) {
  return {
    running: runs.filter((item) => item.status === "running").length,
    succeeded: runs.filter((item) => item.status === "succeeded").length,
    failed: runs.filter((item) => item.status === "failed").length
  };
}

function getRunSortKey(run: ExecutionRun): string {
  return run.finishedAt ?? run.startedAt ?? run.logs.at(-1)?.at ?? "";
}

function createRuntimeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function formatNow(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = `${now.getMonth() + 1}`.padStart(2, "0");
  const dd = `${now.getDate()}`.padStart(2, "0");
  const hh = `${now.getHours()}`.padStart(2, "0");
  const min = `${now.getMinutes()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function buildReply(
  intent: ReturnType<typeof parseIntent>,
  workspaceName: Workspace["name"]
): string {
  switch (intent.kind) {
    case "create-task":
      return `已在 ${workspaceName} 创建任务：${intent.title}`;
    case "switch-page":
      return `已切到 ${pageLabels[intent.page]}。`;
    case "create-rule":
      return `已创建规则草案：当 ${intent.conditionHint} 时，${intent.title}。`;
    default:
      return "已记录。当前一期仅支持创建任务、切页、创建规则。";
  }
}

const pageLabels: Record<PageId, string> = {
  dashboard: "仪表盘",
  events: "事件流",
  tasks: "任务",
  executors: "执行器",
  rules: "规则引擎",
  sources: "信息源"
};

function findById<T extends { id: string }>(items: T[], id?: string): T | undefined {
  return id ? items.find((item) => item.id === id) : undefined;
}

function getStorage() {
  return typeof window === "undefined" ? undefined : window.localStorage;
}
