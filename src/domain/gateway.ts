import type { AttentionLevel, EventItem, PluginSummary, TaskItem, TaskStatus } from "./types";
import pluginSeeds from "../../data/plugins.json";
import ruleSeeds from "../../data/rules.json";

export type PluginRegistry = {
  sources: PluginSummary[];
  executors: PluginSummary[];
  rules: PluginSummary[];
};

export type RuleEvaluationAction =
  | { type: "set_level"; level: AttentionLevel }
  | { type: "create_task"; title?: string; description?: string; priority?: TaskItem["priority"]; status?: TaskStatus }
  | { type: "assign_executor"; executorId: string }
  | { type: "archive_event" }
  | { type: "append_note"; note: string };

export type RuleEvaluationResult = {
  matchedRules: Array<{ id: string; name: string }>;
  actions: RuleEvaluationAction[];
  summary: string;
};

export async function fetchPluginRegistry(): Promise<PluginRegistry> {
  try {
    const [registryResponse, healthResponse] = await Promise.all([fetch("/api/plugins"), fetch("/healthz")]);
    if (!registryResponse.ok) {
      throw new Error(`plugin registry failed: ${registryResponse.status}`);
    }

    const registry = await registryResponse.json();
    const healthPayload = healthResponse.ok ? await healthResponse.json() : undefined;
    const sourceHealth = createHealthMap(healthPayload?.checks?.sources);
    const executorHealth = createHealthMap(healthPayload?.checks?.executors);
    const ruleHealth = createHealthMap(healthPayload?.checks?.rules);

    return {
      sources: (registry.sources ?? []).map((item: Record<string, unknown>) => normalizePluginSummary(item, sourceHealth, item.kind as string)),
      executors: (registry.executors ?? []).map((item: Record<string, unknown>) => normalizePluginSummary(item, executorHealth, item.kind as string)),
      rules: (registry.rules ?? []).map((item: Record<string, unknown>) => normalizePluginSummary(item, ruleHealth, "rule"))
    };
  } catch {
    return {
      sources: (pluginSeeds.sources ?? []).map((item) =>
        normalizePluginSummary(item as unknown as Record<string, unknown>, new Map(), String(item.kind))
      ),
      executors: (pluginSeeds.executors ?? []).map((item) =>
        normalizePluginSummary(item as unknown as Record<string, unknown>, new Map(), String(item.kind))
      ),
      rules: (ruleSeeds.rules ?? []).map((item) =>
        normalizePluginSummary(item as unknown as Record<string, unknown>, new Map(), "rule")
      )
    };
  }
}

export async function syncRealSource(sourceId: string): Promise<{ events: EventItem[] }> {
  try {
    const response = await fetch(`/api/sources/${sourceId}/sync`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({})
    });
    if (!response.ok) {
      throw new Error(`source sync failed: ${response.status}`);
    }
    return response.json();
  } catch {
    return { events: buildLocalEvents(sourceId) };
  }
}

export async function runExternalExecutor(executorId: string, task: TaskItem): Promise<{ summary: string; log: string; raw?: string }> {
  try {
    const response = await fetch(`/api/executors/${executorId}/run`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ task })
    });
    if (!response.ok) {
      throw new Error(`executor run failed: ${response.status}`);
    }
    return response.json();
  } catch {
    return {
      summary: `${task.title} 已由本地回退执行器完成`,
      log: `未连 API，已走本地回退执行器：${executorId}`
    };
  }
}

export async function evaluateEventRules(event: EventItem, workspaceId: string): Promise<RuleEvaluationResult> {
  try {
    const response = await fetch("/api/rules/evaluate", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ event, workspaceId })
    });
    if (!response.ok) {
      throw new Error(`rule evaluate failed: ${response.status}`);
    }
    return response.json();
  } catch {
    return evaluateLocalRules(event, workspaceId);
  }
}

function normalizePluginSummary(
  item: Record<string, unknown>,
  healthMap: Map<string, HealthCheck>,
  kindFallback: string
): PluginSummary {
  const health = isString(item.id) ? healthMap.get(item.id) : undefined;
  return {
    id: String(item.id ?? ""),
    pluginId: String(item.pluginId ?? item.id ?? ""),
    workspaceId: String(item.workspaceId ?? ""),
    kind: String(item.kind ?? kindFallback),
    name: String(item.name ?? item.id ?? item.pluginId ?? "未命名插件"),
    enabled: Boolean(item.enabled ?? true),
    health: health
      ? {
          status: normalizeHealthStatus(health.status),
          message: health.detail
        }
      : {
          status: "ok",
          message: "本地回退数据"
        },
    lastError: health?.status === "error" ? health.detail : undefined
  };
}

function normalizeHealthStatus(status: string): "ok" | "warning" | "error" {
  if (status === "error") {
    return "error";
  }
  if (status === "warning") {
    return "warning";
  }
  return "ok";
}

type HealthCheck = {
  id: string;
  status: string;
  detail?: string;
};

function createHealthMap(value: unknown): Map<string, HealthCheck> {
  if (!Array.isArray(value)) {
    return new Map();
  }

  return new Map(
    value
      .filter((item): item is HealthCheck => {
        return typeof item === "object" && item !== null && isString((item as Record<string, unknown>).id) && isString((item as Record<string, unknown>).status);
      })
      .map((item) => [item.id, item] as const)
  );
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isAttentionLevel(value: unknown): value is AttentionLevel {
  return value === "L0" || value === "L1" || value === "L2" || value === "L3";
}

function buildLocalEvents(sourceId: string): EventItem[] {
  const now = formatNow();
  switch (sourceId) {
    case "source_email_local":
      return [
        {
          id: `ev_local_${sourceId}`,
          workspaceId: "ws_personal",
          title: "客户续费邮件，需要今天给出方案",
          source: "Local Email Inbox",
          sender: "邮箱轮询",
          level: "L2",
          summary: "本地回退事件。未连 API 时，用静态邮件事件保证 H5 可演示。",
          happenedAt: now,
          tags: ["邮件", "客户"]
        }
      ];
    case "source_dingtalk_webhook":
      return [
        {
          id: `ev_local_${sourceId}`,
          workspaceId: "ws_team",
          title: "钉钉告警：发布后接口 5xx 上升",
          source: "DingTalk Webhook",
          sender: "钉钉告警",
          level: "L3",
          summary: "本地回退事件。模拟 webhook 推入的告警。",
          happenedAt: now,
          tags: ["钉钉", "告警"]
        }
      ];
    case "source_3":
      return [
        {
          id: `ev_local_${sourceId}`,
          workspaceId: "ws_study",
          title: "ArXiv：多 Agent 协作评测新论文",
          source: "ArXiv RSS",
          sender: "RSS 回退",
          level: "L1",
          summary: "本地回退事件。模拟论文 RSS 同步结果。",
          happenedAt: now,
          tags: ["论文", "Agent", "RSS"]
        }
      ];
    default:
      return [];
  }
}

function evaluateLocalRules(event: EventItem, workspaceId: string): RuleEvaluationResult {
  const matchedRules = (ruleSeeds.rules ?? []).filter((rule) => {
    if (rule.workspaceId !== workspaceId || !rule.enabled) {
      return false;
    }
    return matchesWhen(event, rule.when);
  });

  const actions: RuleEvaluationAction[] = [];
  matchedRules.forEach((rule) => {
    (rule.then ?? []).forEach((step) => {
      const entry = step as Record<string, unknown>;
      const type = String(entry.type ?? "");
      if (type === "set_level" && isAttentionLevel(entry.level)) {
        actions.push({ type: "set_level", level: entry.level });
      }
      if (type === "assign_executor" && isString(entry.executorId)) {
        actions.push({ type: "assign_executor", executorId: entry.executorId });
      }
      if (type === "archive_event") {
        actions.push({ type: "archive_event" });
      }
      if (type === "append_note" && isString(entry.noteTemplate)) {
        actions.push({ type: "append_note", note: entry.noteTemplate.replaceAll("{{title}}", event.title) });
      }
      if (type === "create_task") {
        actions.push({
          type: "create_task",
          title: isString(entry.titleTemplate) ? entry.titleTemplate.replaceAll("{{title}}", event.title) : event.title
        });
      }
    });
  });

  return {
    matchedRules: matchedRules.map((rule) => ({ id: rule.id, name: String(rule.pluginId ?? rule.id) })),
    actions,
    summary: matchedRules.length ? `本地规则命中 ${matchedRules.length} 条。` : "未命中本地规则。"
  };
}

function matchesWhen(event: EventItem, when: Record<string, unknown> | undefined): boolean {
  if (!when) {
    return false;
  }
  const all = Array.isArray(when.all) ? when.all : undefined;
  const any = Array.isArray(when.any) ? when.any : undefined;
  if (all) {
    return all.every((entry) => matchesClause(event, entry));
  }
  if (any) {
    return any.some((entry) => matchesClause(event, entry));
  }
  return false;
}

function matchesClause(event: EventItem, clause: unknown): boolean {
  if (!clause || typeof clause !== "object") {
    return false;
  }
  const item = clause as Record<string, unknown>;
  const field = String(item.field ?? "");
  const op = String(item.op ?? "");
  const value = String(item.value ?? "");
  const fieldValue = getEventField(event, field);
  if (Array.isArray(fieldValue)) {
    return op === "includes" ? fieldValue.includes(value) : false;
  }
  if (typeof fieldValue === "string") {
    if (op === "equals") {
      return fieldValue === value;
    }
    if (op === "includes") {
      return fieldValue.includes(value);
    }
  }
  return false;
}

function getEventField(event: EventItem, field: string): string | string[] | undefined {
  switch (field) {
    case "source":
      return event.source;
    case "title":
      return event.title;
    case "tags":
      return event.tags;
    default:
      return undefined;
  }
}

function formatNow() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = `${now.getMonth() + 1}`.padStart(2, "0");
  const dd = `${now.getDate()}`.padStart(2, "0");
  const hh = `${now.getHours()}`.padStart(2, "0");
  const min = `${now.getMinutes()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}
