import test from "node:test";
import assert from "node:assert/strict";

import { getHealthReport } from "../lib/health.mjs";

test("getHealthReport warns when opencode command is unavailable", async () => {
  const report = await getHealthReport({
    sources: [],
    executors: [
      {
        id: "exec_opencode",
        enabled: true,
        kind: "opencode",
        command: "definitely-not-installed-opencode"
      }
    ],
    rules: []
  });

  assert.equal(report.ok, true);
  assert.equal(report.checks.executors[0].status, "warning");
});
