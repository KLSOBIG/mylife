import type { EventItem, TaskItem } from "./types";

export type PluginRegistry = {
  sources: Array<{
    id: string;
    pluginId: string;
    workspaceId: string;
    kind: string;
    name: string;
    enabled: boolean;
  }>;
  executors: Array<{
    id: string;
    pluginId: string;
    workspaceId: string;
    kind: string;
    name: string;
    enabled: boolean;
  }>;
};

export async function fetchPluginRegistry(): Promise<PluginRegistry> {
  const response = await fetch("/api/plugins");
  if (!response.ok) {
    throw new Error(`plugin registry failed: ${response.status}`);
  }
  return response.json();
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
