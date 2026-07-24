import { readFile } from "node:fs/promises";

function resolveInboxPath(source) {
  return process.env[source.config?.inboxPathEnv] || source.config?.inboxPath;
}

export async function syncEmailSource(source) {
  const inboxPath = resolveInboxPath(source);
  if (!inboxPath) {
    throw new Error(`email source ${source.id} missing inboxPath`);
  }

  const raw = JSON.parse(await readFile(inboxPath, "utf8"));
  const messages = Array.isArray(raw.messages) ? raw.messages : [];

  return messages.slice(0, source.config.limit || 20).map((message, index) => ({
    id: message.id || `ev_email_${source.id}_${Date.now()}_${index}`,
    workspaceId: source.workspaceId,
    title: message.subject || "未命名邮件",
    source: source.name,
    sender: message.from || source.name,
    level: source.config.level || "L1",
    summary: message.summary || message.text || "",
    happenedAt: message.receivedAt || new Date().toISOString().slice(0, 16).replace("T", " "),
    tags: [...new Set([...(source.config.tags || []), ...(message.tags || [])])]
  }));
}
