import type { AttentionLevel, EventItem, PluginSummary, TaskItem, TaskStatus } from "./types";

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
}

export async function syncRealSource(sourceId: string): Promise<{ events: EventItem[] }> {
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
}

export async function runExternalExecutor(executorId: string, task: TaskItem): Promise<{ summary: string; log: string; raw?: string }> {
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
}

export async function evaluateEventRules(event: EventItem, workspaceId: string): Promise<RuleEvaluationResult> {
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
      : undefined,
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
