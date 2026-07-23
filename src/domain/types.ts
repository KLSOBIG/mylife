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
  status: "idle" | "busy" | "offline" | "error";
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

export interface SourceItem {
  id: string;
  workspaceId: string;
  name: string;
  kind: "webhook" | "api" | "polling" | "cli" | "sdk";
  status: "connected" | "warning" | "offline";
  icon: string;
  description: string;
  stat: string;
}

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
}
