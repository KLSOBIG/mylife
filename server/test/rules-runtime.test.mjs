import test from "node:test";
import assert from "node:assert/strict";

import { evaluateRules } from "../lib/rules/runtime.mjs";

test("evaluateRules matches keyword rule and emits actions", () => {
  const result = evaluateRules({
    workspaceId: "ws_team",
    event: {
      title: "紧急 告警",
      source: "钉钉",
      sender: "ops-bot",
      tags: ["告警"]
    },
    rules: [
      {
        id: "rule_dingtalk_alert",
        pluginId: "rule.keyword",
        workspaceId: "ws_team",
        enabled: true,
        priority: 100,
        when: {
          any: [
            { field: "title", op: "includes", value: "紧急" },
            { field: "tags", op: "includes", value: "告警" }
          ]
        },
        then: [
          { type: "set_level", level: "L3" },
          { type: "create_task", titleTemplate: "{{title}}" }
        ]
      }
    ]
  });

  assert.equal(result.matchedRules.length, 1);
  assert.equal(result.actions[0].type, "set_level");
  assert.equal(result.actions[1].type, "create_task");
});
