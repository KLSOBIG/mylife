import { createSeedData } from "./mock-data";
import type { ChatMode, ExecutionLog, ExecutionRun, PageId, TaskStatus } from "./types";
import type {
  AppData,
  AppModel,
  AppState,
  AttentionLevel,
  ChatMessage,
  EventItem,
  RuleItem,
  RuleSuggestion,
  SourceItem,
  TaskItem,
  Workspace
} from "./types";

export type { AppData, AppModel, AppState } from "./types";

ensureBrowserApis();

export type AppAction =
  | { type: "page/switched"; page: PageId }
  | { type: "workspace/switched"; workspaceId: string }
  | { type: "workspace/created"; workspace: Workspace }
  | { type: "event/selected"; eventId?: string }
  | { type: "event/created"; event: EventItem }
  | { type: "events/filterChanged"; filter: AppState["eventFilter"] }
  | { type: "events/sourceFilterChanged"; source: AppState["eventSourceFilter"] }
  | { type: "events/queryChanged"; query: string }
  | { type: "event/convertedToTask"; eventId: string; task: TaskItem }
  | { type: "task/selected"; taskId?: string }
  | { type: "task/created"; task: TaskItem }
  | { type: "task/statusChanged"; taskId: string; status: TaskStatus }
  | { type: "task/assigneeChanged"; taskId: string; assigneeId?: string }
  | { type: "task/executionStarted"; run: ExecutionRun }
  | { type: "task/executionRunning"; taskId: string; runId: string; log: ExecutionLog }
  | { type: "task/executionSucceeded"; taskId: string; runId: string; log?: ExecutionLog; finishedAt: string; summary?: string }
  | { type: "task/executionFailed"; taskId: string; runId: string; log?: ExecutionLog; finishedAt: string; error: string }
  | { type: "task/viewChanged"; view: AppState["taskView"] }
  | { type: "rule/created"; rule: RuleItem }
  | { type: "rule/toggled"; ruleId: string; enabled?: boolean }
  | { type: "rule/suggestionApplied"; suggestion: RuleSuggestion; rule: RuleItem }
  | { type: "source/created"; source: SourceItem }
  | { type: "source/toggled"; sourceId: string; enabled?: boolean; status?: SourceItem["status"] }
  | { type: "chat/toggled" }
  | { type: "chat/openChanged"; open: boolean }
  | { type: "chat/pinnedToggled" }
  | { type: "chat/modeChanged"; mode: ChatMode }
  | { type: "chat/messageSubmitted"; message: string; reply?: string }
  | { type: "commandPalette/openChanged"; open: boolean };

export function createInitialState(): AppState {
  return {
    currentPage: "dashboard",
    currentWorkspaceId: "ws_personal",
    selectedEventId: undefined,
    selectedTaskId: undefined,
    chatOpen: false,
    chatPinned: false,
    chatMode: "side",
    commandPaletteOpen: false,
    eventFilter: "all",
    eventSourceFilter: "all",
    eventQuery: "",
    taskView: "kanban"
  };
}

export function createInitialModel(): AppModel {
  return {
    state: createInitialState(),
    data: cloneAppData(createSeedData())
  };
}

export function reduceState(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "page/switched":
      return {
        ...state,
        currentPage: action.page,
        selectedEventId: undefined,
        selectedTaskId: undefined,
        commandPaletteOpen: false
      };
    case "workspace/switched":
      return {
        ...state,
        currentWorkspaceId: action.workspaceId,
        selectedEventId: undefined,
        selectedTaskId: undefined,
        currentPage: "dashboard",
        eventFilter: "all",
        eventSourceFilter: "all",
        eventQuery: "",
        commandPaletteOpen: false
      };
    case "workspace/created":
      return {
        ...state,
        currentWorkspaceId: action.workspace.id,
        currentPage: "dashboard",
        selectedEventId: undefined,
        selectedTaskId: undefined,
        eventFilter: "all",
        eventSourceFilter: "all",
        eventQuery: "",
        commandPaletteOpen: false
      };
    case "event/selected":
      return { ...state, selectedEventId: action.eventId, selectedTaskId: undefined };
    case "task/selected":
      return { ...state, selectedTaskId: action.taskId, selectedEventId: undefined };
    case "task/created":
      return {
        ...state,
        currentPage: "tasks",
        selectedTaskId: action.task.id,
        selectedEventId: undefined,
        commandPaletteOpen: false
      };
    case "task/statusChanged":
      return {
        ...state,
        currentPage: "tasks",
        selectedTaskId: action.taskId,
        selectedEventId: undefined
      };
    case "task/assigneeChanged":
      return {
        ...state,
        currentPage: "tasks",
        selectedTaskId: action.taskId,
        selectedEventId: undefined
      };
    case "task/executionStarted":
      return {
        ...state,
        currentPage: "tasks",
        selectedTaskId: action.run.taskId,
        selectedEventId: undefined
      };
    case "task/executionRunning":
    case "task/executionSucceeded":
    case "task/executionFailed":
      return {
        ...state,
        currentPage: "tasks",
        selectedTaskId: action.taskId,
        selectedEventId: undefined
      };
    case "event/created":
      return {
        ...state,
        currentPage: "events",
        selectedEventId: action.event.id,
        selectedTaskId: undefined
      };
    case "event/convertedToTask":
      return {
        ...state,
        currentPage: "tasks",
        selectedTaskId: action.task.id,
        selectedEventId: undefined
      };
    case "events/filterChanged":
      return { ...state, currentPage: "events", eventFilter: action.filter };
    case "events/sourceFilterChanged":
      return { ...state, currentPage: "events", eventSourceFilter: action.source };
    case "events/queryChanged":
      return { ...state, currentPage: "events", eventQuery: action.query };
    case "task/viewChanged":
      return { ...state, currentPage: "tasks", taskView: action.view };
    case "rule/created":
    case "rule/toggled":
    case "rule/suggestionApplied":
      return { ...state, currentPage: "rules", commandPaletteOpen: false };
    case "source/created":
    case "source/toggled":
      return { ...state, currentPage: "sources" };
    case "chat/toggled":
      return { ...state, chatOpen: !state.chatOpen };
    case "chat/openChanged":
      return { ...state, chatOpen: action.open };
    case "chat/pinnedToggled":
      return { ...state, chatPinned: !state.chatPinned };
    case "chat/modeChanged":
      return { ...state, chatMode: action.mode };
    case "chat/messageSubmitted":
      return { ...state, chatOpen: true };
    case "commandPalette/openChanged":
      return { ...state, commandPaletteOpen: action.open };
    default:
      return state;
  }
}

export function reduceModel(model: AppModel, action: AppAction): AppModel {
  const nextState = reduceState(model.state, action);
  const nextData = reduceData(model.data, action);

  if (nextState === model.state && nextData === model.data) {
    return model;
  }

  return { state: nextState, data: nextData };
}

function reduceData(data: AppData, action: AppAction): AppData {
  switch (action.type) {
    case "workspace/created":
      return {
        ...data,
        workspaces: [...data.workspaces, action.workspace]
      };
    case "event/created":
      return {
        ...data,
        events: [action.event, ...data.events]
      };
    case "task/created":
      return {
        ...data,
        tasks: [action.task, ...data.tasks]
      };
    case "task/statusChanged":
      return updateById(data, "tasks", action.taskId, (task) => ({ ...task, status: action.status }));
    case "task/assigneeChanged":
      return updateById(data, "tasks", action.taskId, (task) => ({
        ...task,
        assigneeId: action.assigneeId || undefined
      }));
    case "rule/created":
      return {
        ...data,
        rules: [action.rule, ...data.rules]
      };
    case "rule/toggled":
      return updateById(data, "rules", action.ruleId, (rule) => ({
        ...rule,
        enabled: action.enabled ?? !rule.enabled
      }));
    case "rule/suggestionApplied":
      return {
        ...data,
        rules: [action.rule, ...data.rules],
        ruleSuggestions: data.ruleSuggestions.filter((item) => item.id !== action.suggestion.id)
      };
    case "source/created":
      return {
        ...data,
        sources: [action.source, ...data.sources]
      };
    case "source/toggled":
      return updateById(data, "sources", action.sourceId, (source) => ({
        ...source,
        enabled: action.enabled ?? !source.enabled,
        status: action.status ?? source.status
      }));
    case "event/convertedToTask":
      return {
        ...data,
        tasks: [action.task, ...data.tasks]
      };
    case "task/executionStarted":
      return {
        ...data,
        tasks: data.tasks.map((task) =>
          task.id === action.run.taskId
            ? { ...task, assigneeId: action.run.executorId, status: "in_progress" }
            : task
        ),
        executionRuns: [action.run, ...data.executionRuns]
      };
    case "task/executionRunning":
      return updateExecutionRun(data, action.runId, (run) => ({
        ...run,
        status: "running",
        startedAt: run.startedAt ?? action.log.at,
        logs: [...run.logs, action.log]
      }));
    case "task/executionSucceeded":
      return updateExecutionOutcome(data, action.taskId, action.runId, {
        status: "succeeded",
        finishedAt: action.finishedAt,
        summary: action.summary,
        log: action.log
      });
    case "task/executionFailed":
      return updateExecutionOutcome(data, action.taskId, action.runId, {
        status: "failed",
        finishedAt: action.finishedAt,
        error: action.error,
        log: action.log
      });
    case "chat/messageSubmitted":
      return {
        ...data,
        chatMessages: appendMessages(data.chatMessages, action.message, action.reply)
      };
    default:
      return data;
  }
}

function appendMessages(messages: ChatMessage[], message: string, reply?: string): ChatMessage[] {
  const next = [
    ...messages,
    createChatMessage("user", message, messages.length + 1)
  ];

  if (reply) {
    next.push(createChatMessage("ai", reply, next.length + 1));
  }

  return next;
}

function createChatMessage(role: ChatMessage["role"], content: string, index: number): ChatMessage {
  return {
    id: `msg_${index}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    content
  };
}

function updateById<K extends keyof Pick<AppData, "tasks" | "rules" | "sources">>(
  data: AppData,
  key: K,
  id: string,
  updater: (item: AppData[K][number]) => AppData[K][number]
): AppData {
  const items = data[key];
  const nextItems = items.map((item) => (item.id === id ? updater(item) : item));
  const changed = nextItems.some((item, index) => item !== items[index]);

  if (!changed) {
    return data;
  }

  return { ...data, [key]: nextItems };
}

function updateExecutionRun(
  data: AppData,
  runId: string,
  updater: (run: AppData["executionRuns"][number]) => AppData["executionRuns"][number]
): AppData {
  const nextRuns = data.executionRuns.map((run) => (run.id === runId ? updater(run) : run));
  const changed = nextRuns.some((run, index) => run !== data.executionRuns[index]);

  if (!changed) {
    return data;
  }

  return {
    ...data,
    executionRuns: nextRuns
  };
}

function updateExecutionOutcome(
  data: AppData,
  taskId: string,
  runId: string,
  outcome: {
    status: "succeeded" | "failed";
    finishedAt: string;
    summary?: string;
    error?: string;
    log?: ExecutionLog;
  }
): AppData {
  const withRuns = updateExecutionRun(data, runId, (run) => ({
    ...run,
    status: outcome.status,
    finishedAt: outcome.finishedAt,
    summary: outcome.status === "succeeded" ? outcome.summary ?? run.summary : run.summary,
    error: outcome.status === "failed" ? outcome.error ?? run.error : undefined,
    logs: outcome.log ? [...run.logs, outcome.log] : run.logs
  }));

  return updateById(withRuns, "tasks", taskId, (task) => ({
    ...task,
    status: outcome.status === "succeeded" ? "pending_review" : "returned"
  }));
}

export function createWorkspaceFromDraft(draft: {
  name: string;
  kind: Workspace["kind"];
  description: string;
  icon?: string;
}): Workspace {
  const trimmedName = draft.name.trim();
  const fallbackIcon = trimmedName ? trimmedName.slice(0, 1).toUpperCase() : "工";
  return {
    id: createId("ws"),
    name: trimmedName,
    kind: draft.kind,
    description: draft.description.trim(),
    icon: draft.icon?.trim() || fallbackIcon
  };
}

export function createTaskFromDraft(
  workspaceId: string,
  draft: Pick<TaskItem, "title" | "description" | "type" | "priority" | "level" | "status"> & { dueAt?: string }
): TaskItem {
  return {
    id: createId("task"),
    workspaceId,
    title: draft.title.trim(),
    description: draft.description.trim(),
    type: draft.type,
    priority: draft.priority,
    level: draft.level,
    status: draft.status,
    dueAt: draft.dueAt?.trim() || undefined
  };
}

export function createEventFromDraft(
  workspaceId: string,
  draft: Pick<EventItem, "title" | "source" | "sender" | "level" | "summary" | "tags">
): EventItem {
  return {
    id: createId("ev"),
    workspaceId,
    title: draft.title.trim(),
    source: draft.source.trim(),
    sender: draft.sender.trim(),
    level: draft.level,
    summary: draft.summary.trim(),
    happenedAt: formatNow(),
    tags: draft.tags
  };
}

export function createRuleFromDraft(
  workspaceId: string,
  draft: Pick<RuleItem, "name" | "description" | "level" | "condition" | "action">
): RuleItem {
  return {
    id: createId("rule"),
    workspaceId,
    name: draft.name.trim(),
    description: draft.description.trim(),
    level: draft.level,
    enabled: true,
    condition: draft.condition.trim(),
    action: draft.action.trim(),
    triggeredCount: 0,
    successRate: 100
  };
}

export function createRuleFromSuggestion(workspaceId: string, suggestion: RuleSuggestion): RuleItem {
  return {
    id: createId("rule"),
    workspaceId,
    name: suggestion.title,
    description: suggestion.description,
    level: "L1",
    enabled: true,
    condition: suggestion.condition,
    action: suggestion.action,
    triggeredCount: 0,
    successRate: Math.min(100, suggestion.confidence)
  };
}

export function createSourceFromDraft(
  workspaceId: string,
  draft: Pick<SourceItem, "name" | "kind" | "status" | "icon" | "description" | "stat">
): SourceItem {
  return {
    id: createId("source"),
    workspaceId,
    name: draft.name.trim(),
    kind: draft.kind,
    status: draft.status,
    enabled: true,
    icon: draft.icon.trim() || "S",
    description: draft.description.trim(),
    stat: draft.stat.trim()
  };
}

export function createTaskFromIntent(
  workspaceId: string,
  title: string,
  priority: TaskItem["priority"] = "high"
): TaskItem {
  return {
    id: createId("task"),
    workspaceId,
    title: title.trim(),
    description: "由对话入口创建，等待进一步处理。",
    type: "action",
    priority,
    level: priority === "urgent" ? "L3" : priority === "high" ? "L2" : "L1",
    status: "pending_assignment"
  };
}

export function createExecutionRun(
  task: TaskItem,
  executorId: string,
  trigger: ExecutionRun["trigger"] = "manual"
): ExecutionRun {
  return {
    id: createId("run"),
    workspaceId: task.workspaceId,
    taskId: task.id,
    executorId,
    status: "queued",
    trigger,
    logs: [createExecutionLog("info", "任务已派发，等待执行器领取。")]
  };
}

export function createExecutionLog(level: ExecutionLog["level"], message: string): ExecutionLog {
  return {
    id: createId("log"),
    at: formatNow(),
    level,
    message
  };
}

function createId(prefix: string): string {
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

function cloneAppData(data: AppData): AppData {
  return typeof structuredClone === "function" ? structuredClone(data) : JSON.parse(JSON.stringify(data));
}

function ensureBrowserApis(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (typeof window.matchMedia !== "function") {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {
          return false;
        }
      })
    });
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
    get length() {
      return entries.size;
    },
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
