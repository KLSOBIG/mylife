import { materializeActions } from "./actions.mjs";
import { matchCondition } from "./matchers.mjs";

export function evaluateRules({ workspaceId, event, rules }) {
  const candidates = (rules || [])
    .filter((rule) => rule.enabled)
    .filter((rule) => !rule.workspaceId || rule.workspaceId === workspaceId)
    .sort((left, right) => (right.priority || 0) - (left.priority || 0));

  const matchedRules = candidates.filter((rule) => matchCondition(rule.when, event, workspaceId));
  const actions = matchedRules.flatMap((rule) => materializeActions(rule, event));

  return {
    workspaceId,
    matchedRules: matchedRules.map((rule) => ({
      id: rule.id,
      pluginId: rule.pluginId,
      priority: rule.priority
    })),
    actions,
    summary: matchedRules.length
      ? `matched ${matchedRules.length} rule(s): ${matchedRules.map((rule) => rule.id).join(", ")}`
      : "no matching rules"
  };
}
