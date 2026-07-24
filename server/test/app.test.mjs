import test from "node:test";
import assert from "node:assert/strict";

import { startServer } from "../app.mjs";

async function withServer(run) {
  const server = await startServer({ port: 0, host: "127.0.0.1", quiet: true });
  const address = server.address();

  try {
    await run(`http://${address.address}:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/plugins returns sources executors and rules", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/plugins`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(payload.sources));
    assert.ok(Array.isArray(payload.executors));
    assert.ok(Array.isArray(payload.rules));
  });
});

test("POST /api/rules/evaluate evaluates event against rules", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/rules/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workspaceId: "ws_study",
        event: {
          title: "Agent paper weekly digest",
          source: "ArXiv RSS",
          sender: "ArXiv RSS",
          tags: ["论文", "Agent", "RSS"]
        }
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(payload.matchedRules));
    assert.ok(Array.isArray(payload.actions));
  });
});
