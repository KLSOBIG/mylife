export type PageId = "dashboard" | "events" | "tasks" | "executors" | "rules" | "sources";
export type WorkspaceKind = "personal" | "team" | "study" | "life";
export type AttentionLevel = "L0" | "L1" | "L2" | "L3";
export type TaskStatus =
  | "pending_assignment"
  | "assigned"
  | "in_progress"
  | "pending_review"
  | "completed"
  | "suspended"
  | "escalated"
  | "returned";
export type SourceKind = "webhook" | "api" | "polling" | "cli" | "sdk";
export type SourceStatus = "connected" | "warning" | "offline";
export type ExecutorStatus = "idle" | "busy" | "offline" | "error";
export type ChatMode = "side" | "modal";
export type TaskView = "kanban" | "list";

export interface Workspace {
  id: string;
  name: string;
  kind: WorkspaceKind;
  description: string;
  icon: string;
}

export interface EventItem {
  id: string;
  workspaceId: string;
  title: string;
  source: string;
  sender: string;
  level: AttentionLevel;
  summary: string;
  happenedAt: string;
  tags: string[];
}

export interface TaskItem {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  type: "event" | "action" | "system" | "plugin";
  priority: "urgent" | "high" | "medium" | "low";
  level: AttentionLevel;
  status: TaskStatus;
  assigneeId?: string;
  source?: string;
  dueAt?: string;
}

export interface ExecutorItem {
  id: string;
  workspaceId: string;
  name: string;
  role: string;
  type: "agent" | "human";
  status: ExecutorStatus;
  avatar: string;
  capabilities: string[];
  successRate: number;
  activeTasks: number;
  completedToday: number;
}

export interface RuleItem {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  level: AttentionLevel;
  enabled: boolean;
  condition: string;
  action: string;
  triggeredCount: number;
  successRate: number;
}

export interface RuleSuggestion {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  confidence: number;
  condition: string;
  action: string;
}

export interface SourceItem {
  id: string;
  workspaceId: string;
  name: string;
  kind: SourceKind;
  status: SourceStatus;
  enabled: boolean;
  icon: string;
  description: string;
  stat: string;
}

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
}

export interface AppData {
  workspaces: Workspace[];
  events: EventItem[];
  tasks: TaskItem[];
  executors: ExecutorItem[];
  rules: RuleItem[];
  ruleSuggestions: RuleSuggestion[];
  sources: SourceItem[];
  chatMessages: ChatMessage[];
}

export interface AppState {
  currentPage: PageId;
  currentWorkspaceId: Workspace["id"];
  selectedEventId?: string;
  selectedTaskId?: string;
  chatOpen: boolean;
  chatPinned: boolean;
  chatMode: ChatMode;
  commandPaletteOpen: boolean;
  eventFilter: "all" | AttentionLevel;
  eventSourceFilter: "all" | string;
  eventQuery: string;
  taskView: TaskView;
}

export interface AppModel {
  state: AppState;
  data: AppData;
}

export interface CommandItem {
  id: string;
  label: string;
  hint?: string;
}
