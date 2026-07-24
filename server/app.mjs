import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const port = Number(process.env.NEXUS_API_PORT || 4318);
const pluginsFile = new URL("../data/plugins.json", import.meta.url);

const server = createServer(async (req, res) => {
  applyCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);

  try {
    if (req.method === "GET" && requestUrl.pathname === "/healthz") {
      return sendJson(res, 200, { ok: true, now: new Date().toISOString() });
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/plugins") {
      return sendJson(res, 200, await loadPlugins());
    }

    if (req.method === "POST" && requestUrl.pathname.startsWith("/api/sources/") && requestUrl.pathname.endsWith("/sync")) {
      const sourceId = requestUrl.pathname.split("/")[3];
      const registry = await loadPlugins();
      const source = registry.sources.find((item) => item.id === sourceId);
      if (!source) {
        return sendJson(res, 404, { error: `source ${sourceId} not found` });
      }

      const events = await syncSource(source);
      return sendJson(res, 200, { sourceId, events });
    }

    if (req.method === "POST" && requestUrl.pathname.startsWith("/api/executors/") && requestUrl.pathname.endsWith("/run")) {
      const executorId = requestUrl.pathname.split("/")[3];
      const registry = await loadPlugins();
      const executor = registry.executors.find((item) => item.id === executorId);
      if (!executor) {
        return sendJson(res, 404, { error: `executor ${executorId} not found` });
      }

      const body = await readJson(req);
      const result = await runExecutor(executor, body?.task ?? {});
      return sendJson(res, 200, result);
    }

    return sendJson(res, 404, { error: "not found" });
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`nexus api listening on http://127.0.0.1:${port}`);
});

async function loadPlugins() {
  return JSON.parse(await readFile(pluginsFile, "utf8"));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function syncSource(source) {
  if (source.kind !== "polling") {
    throw new Error(`source ${source.id} is not syncable yet`);
  }

  const response = await fetch(source.config.url, {
    headers: {
      "user-agent": "nexus-local-source-sync"
    }
  });

  if (!response.ok) {
    throw new Error(`fetch failed: ${response.status}`);
  }

  const xml = await response.text();
  const items = parseRssItems(xml).slice(0, source.config.limit || 5);
  return items.map((item, index) => ({
    id: `ev_sync_${source.id}_${Date.now()}_${index}`,
    workspaceId: source.workspaceId,
    title: item.title,
    source: source.name,
    sender: source.config.sender || source.name,
    level: source.config.level || "L1",
    summary: item.summary,
    happenedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    tags: source.config.tags || []
  }));
}

function parseRssItems(xml) {
  const chunks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);
  return chunks.map((chunk) => ({
    title: decodeXml(readTag(chunk, "title") || "未命名条目"),
    summary: decodeXml(stripCdata(readTag(chunk, "description") || readTag(chunk, "summary") || ""))
  }));
}

function readTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim();
}

function stripCdata(value) {
  return value.replace(/^<!\\[CDATA\\[/, "").replace(/\\]\\]>$/, "");
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function runExecutor(executor, task) {
  return new Promise((resolve, reject) => {
    const child = spawn(executor.command, executor.args || [], {
      env: {
        ...process.env,
        NEXUS_TASK_PAYLOAD: JSON.stringify(task)
      }
    });

    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`executor timeout after ${executor.timeoutMs}ms`));
    }, executor.timeoutMs || 5000);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new Error(stderr || `executor exited with ${code}`));
      }

      const parsed = tryParseJson(stdout.trim());
      return resolve({
        summary: parsed?.summary || stdout.trim() || `${executor.name} 执行完成`,
        log: parsed?.log || stdout.trim() || `${executor.name} 执行完成`,
        raw: stdout.trim()
      });
    });
  });
}

function tryParseJson(raw) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function applyCors(res) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
}
