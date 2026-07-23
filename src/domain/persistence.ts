import { createInitialModel, type AppModel } from "./store";
import type {
  AppData,
  AppState,
  AttentionLevel,
  ChatMessage,
  EventItem,
  ExecutionLog,
  ExecutionRun,
  ExecutorItem,
  PageId,
  RuleItem,
  RuleSuggestion,
  SourceItem,
  SourceKind,
  SourceStatus,
  TaskItem,
  TaskStatus,
  Workspace,
  WorkspaceKind
} from "./types";

export const STORAGE_KEY = "nexus.v1.phase1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const pageIds: PageId[] = ["dashboard", "events", "tasks", "executors", "rules", "sources"];
const attentionLevels: AttentionLevel[] = ["L0", "L1", "L2", "L3"];
const taskStatuses: TaskStatus[] = [
  "pending_assignment",
  "assigned",
  "in_progress",
  "pending_review",
  "completed",
  "suspended",
  "escalated",
  "returned"
];
const workspaceKinds: WorkspaceKind[] = ["personal", "team", "study", "life"];
const sourceKinds: SourceKind[] = ["webhook", "api", "polling", "cli", "sdk"];
const sourceStatuses: SourceStatus[] = ["connected", "warning", "offline"];

export function loadAppModel(storage?: StorageLike): AppModel {
  const fallback = createInitialModel();

  if (!storage) {
    return fallback;
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    return isAppModel(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveAppModel(model: AppModel, storage?: StorageLike): void {
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(model));
}

function isAppModel(value: unknown): value is AppModel {
  return isRecord(value) && isAppState(value.state) && isAppData(value.data);
}

function isAppState(value: unknown): value is AppState {
  return (
    isRecord(value) &&
    includes(pageIds, value.currentPage) &&
    isString(value.currentWorkspaceId) &&
    isOptionalString(value.selectedEventId) &&
    isOptionalString(value.selectedTaskId) &&
    isBoolean(value.chatOpen) &&
    isBoolean(value.chatPinned) &&
    (value.chatMode === "side" || value.chatMode === "modal") &&
    isBoolean(value.commandPaletteOpen) &&
    (value.eventFilter === "all" || includes(attentionLevels, value.eventFilter)) &&
    (value.eventSourceFilter === "all" || isString(value.eventSourceFilter)) &&
    isString(value.eventQuery) &&
    (value.taskView === "kanban" || value.taskView === "list")
  );
}

function isAppData(value: unknown): value is AppData {
  return (
    isRecord(value) &&
    isArrayOf(value.workspaces, isWorkspace) &&
    isArrayOf(value.events, isEventItem) &&
    isArrayOf(value.tasks, isTaskItem) &&
    isArrayOf(value.executors, isExecutorItem) &&
    isArrayOf(value.executionRuns, isExecutionRun) &&
    isArrayOf(value.rules, isRuleItem) &&
    isArrayOf(value.ruleSuggestions, isRuleSuggestion) &&
    isArrayOf(value.sources, isSourceItem) &&
    isArrayOf(value.chatMessages, isChatMessage)
  );
}

function isExecutionRun(value: unknown): value is ExecutionRun {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.workspaceId) &&
    isString(value.taskId) &&
    isString(value.executorId) &&
    (value.status === "queued" || value.status === "running" || value.status === "succeeded" || value.status === "failed" || value.status === "cancelled") &&
    (value.trigger === "manual" || value.trigger === "auto") &&
    isOptionalString(value.startedAt) &&
    isOptionalString(value.updatedAt) &&
    isOptionalString(value.finishedAt) &&
    isOptionalString(value.summary) &&
    isOptionalString(value.error) &&
    isArrayOf(value.logs, isExecutionLog)
  );
}

function isExecutionLog(value: unknown): value is ExecutionLog {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.at) &&
    (value.level === "info" || value.level === "success" || value.level === "error") &&
    isString(value.message)
  );
}

function isWorkspace(value: unknown): value is Workspace {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    includes(workspaceKinds, value.kind) &&
    isString(value.description) &&
    isString(value.icon)
  );
}

function isEventItem(value: unknown): value is EventItem {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.workspaceId) &&
    isString(value.title) &&
    isString(value.source) &&
    isString(value.sender) &&
    includes(attentionLevels, value.level) &&
    isString(value.summary) &&
    isString(value.happenedAt) &&
    isArrayOf(value.tags, isString)
  );
}

function isTaskItem(value: unknown): value is TaskItem {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.workspaceId) &&
    isString(value.title) &&
    isString(value.description) &&
    (value.type === "event" || value.type === "action" || value.type === "system" || value.type === "plugin") &&
    (value.priority === "urgent" || value.priority === "high" || value.priority === "medium" || value.priority === "low") &&
    includes(attentionLevels, value.level) &&
    includes(taskStatuses, value.status) &&
    isOptionalString(value.assigneeId) &&
    isOptionalString(value.source) &&
    isOptionalString(value.dueAt)
  );
}

function isExecutorItem(value: unknown): value is ExecutorItem {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.workspaceId) &&
    isString(value.name) &&
    isString(value.role) &&
    (value.type === "agent" || value.type === "human") &&
    (value.status === "idle" || value.status === "busy" || value.status === "offline" || value.status === "error") &&
    isString(value.avatar) &&
    isArrayOf(value.capabilities, isString) &&
    isNumber(value.successRate) &&
    isNumber(value.activeTasks) &&
    isNumber(value.completedToday)
  );
}

function isRuleItem(value: unknown): value is RuleItem {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.workspaceId) &&
    isString(value.name) &&
    isString(value.description) &&
    includes(attentionLevels, value.level) &&
    isBoolean(value.enabled) &&
    isString(value.condition) &&
    isString(value.action) &&
    isNumber(value.triggeredCount) &&
    isNumber(value.successRate)
  );
}

function isRuleSuggestion(value: unknown): value is RuleSuggestion {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.workspaceId) &&
    isString(value.title) &&
    isString(value.description) &&
    isNumber(value.confidence) &&
    isString(value.condition) &&
    isString(value.action)
  );
}

function isSourceItem(value: unknown): value is SourceItem {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.workspaceId) &&
    isString(value.name) &&
    includes(sourceKinds, value.kind) &&
    includes(sourceStatuses, value.status) &&
    isBoolean(value.enabled) &&
    isString(value.icon) &&
    isString(value.description) &&
    isString(value.stat)
  );
}

function isChatMessage(value: unknown): value is ChatMessage {
  return isRecord(value) && isString(value.id) && (value.role === "ai" || value.role === "user") && isString(value.content);
}

function isArrayOf<T>(value: unknown, predicate: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.every(predicate);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function includes<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && list.includes(value as T);
}
