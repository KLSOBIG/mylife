import { readFile } from "node:fs/promises";

const pluginsFile = new URL("../../data/plugins.json", import.meta.url);
const rulesFile = new URL("../../data/rules.json", import.meta.url);

function ensureArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

function validateItems(items, label) {
  for (const item of items) {
    if (!item?.id) {
      throw new Error(`${label} item missing id`);
    }
  }
  return items;
}

export async function loadRuleRegistry() {
  const raw = JSON.parse(await readFile(rulesFile, "utf8"));
  return validateItems(ensureArray(raw.rules, "rules"), "rule");
}

export async function loadPluginRegistry() {
  const raw = JSON.parse(await readFile(pluginsFile, "utf8"));
  const rules = await loadRuleRegistry();

  return {
    sources: validateItems(ensureArray(raw.sources, "sources"), "source"),
    executors: validateItems(ensureArray(raw.executors, "executors"), "executor"),
    rules
  };
}

export async function getSourceById(sourceId) {
  const registry = await loadPluginRegistry();
  return registry.sources.find((item) => item.id === sourceId) || null;
}

export async function getExecutorById(executorId) {
  const registry = await loadPluginRegistry();
  return registry.executors.find((item) => item.id === executorId) || null;
}
