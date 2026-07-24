import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

import { createRequestListener } from "./lib/http.mjs";
import { getHealthReport } from "./lib/health.mjs";
import {
  getExecutorById,
  getSourceById,
  loadPluginRegistry,
  loadRuleRegistry
} from "./lib/registry.mjs";
import { syncDingtalkWebhook, syncSource } from "./lib/sources/index.mjs";
import { runExecutor } from "./lib/executors/index.mjs";
import { evaluateRules } from "./lib/rules/runtime.mjs";

const defaultPort = Number(process.env.NEXUS_API_PORT || 4318);

export function createApp() {
  return createRequestListener(async ({ req, requestUrl, sendJson, notFound, readJson }) => {
    if (req.method === "GET" && requestUrl.pathname === "/healthz") {
      const registry = await loadPluginRegistry();
      const health = await getHealthReport(registry);
      return sendJson(200, health);
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/plugins") {
      const registry = await loadPluginRegistry();
      return sendJson(200, registry);
    }

    if (req.method === "POST" && requestUrl.pathname.startsWith("/api/sources/") && requestUrl.pathname.endsWith("/sync")) {
      const sourceId = requestUrl.pathname.split("/")[3];
      const source = await getSourceById(sourceId);
      if (!source) {
        return sendJson(404, { error: `source ${sourceId} not found` });
      }

      const events = await syncSource(source);
      return sendJson(200, { sourceId, events });
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/rules/evaluate") {
      const body = await readJson();
      const rules = await loadRuleRegistry();
      const result = evaluateRules({
        workspaceId: body?.workspaceId,
        event: body?.event,
        rules
      });
      return sendJson(200, result);
    }

    if (req.method === "POST" && requestUrl.pathname.startsWith("/api/executors/") && requestUrl.pathname.endsWith("/run")) {
      const executorId = requestUrl.pathname.split("/")[3];
      const executor = await getExecutorById(executorId);
      if (!executor) {
        return sendJson(404, { error: `executor ${executorId} not found` });
      }

      const body = await readJson();
      const result = await runExecutor(executor, body?.task ?? {});
      return sendJson(200, result);
    }

    if (req.method === "POST" && requestUrl.pathname.startsWith("/api/webhooks/dingtalk/")) {
      const sourceId = requestUrl.pathname.split("/")[4];
      const source = await getSourceById(sourceId);
      if (!source) {
        return sendJson(404, { error: `source ${sourceId} not found` });
      }

      const payload = await readJson();
      const events = syncDingtalkWebhook(source, payload);
      return sendJson(200, { sourceId, accepted: events.length, events });
    }

    return notFound();
  });
}

export function startServer({ port = defaultPort, host = "127.0.0.1", quiet = false } = {}) {
  const server = createServer(createApp());
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      if (!quiet) {
        console.log(`nexus api listening on http://${host}:${server.address().port}`);
      }
      resolve(server);
    });
  });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  startServer().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
