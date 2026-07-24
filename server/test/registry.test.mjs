import test from "node:test";
import assert from "node:assert/strict";

import { loadPluginRegistry, loadRuleRegistry } from "../lib/registry.mjs";

test("loadPluginRegistry returns sources executors and rules arrays", async () => {
  const registry = await loadPluginRegistry();

  assert.ok(Array.isArray(registry.sources));
  assert.ok(Array.isArray(registry.executors));
  assert.ok(Array.isArray(registry.rules));
  assert.ok(registry.sources.length > 0);
  assert.ok(registry.executors.length > 0);
});

test("loadRuleRegistry returns enabled rules", async () => {
  const rules = await loadRuleRegistry();

  assert.ok(Array.isArray(rules));
  assert.ok(rules.length > 0);
  assert.equal(typeof rules[0].id, "string");
});
