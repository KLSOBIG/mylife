import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { spawnSync } from "node:child_process";

function resolveInboxPath(source) {
  return process.env[source.config?.inboxPathEnv] || source.config?.inboxPath || "";
}

function commandExists(command) {
  if (!command) {
    return false;
  }

  const result = spawnSync("bash", ["-lc", `command -v ${JSON.stringify(command)}`], {
    encoding: "utf8"
  });
  return result.status === 0;
}

async function checkSource(source) {
  if (!source.enabled) {
    return { id: source.id, status: "warning", detail: "disabled" };
  }

  if (source.kind === "email_polling") {
    const inboxPath = resolveInboxPath(source);
    if (!inboxPath) {
      return { id: source.id, status: "warning", detail: "missing inboxPath" };
    }

    try {
      await access(inboxPath, fsConstants.R_OK);
      return { id: source.id, status: "ok", detail: inboxPath };
    } catch {
      return { id: source.id, status: "warning", detail: `inbox file not found: ${inboxPath}` };
    }
  }

  return { id: source.id, status: "ok", detail: source.kind };
}

function checkExecutor(executor) {
  if (!executor.enabled) {
    return { id: executor.id, status: "warning", detail: "disabled" };
  }

  if (executor.command && commandExists(executor.command)) {
    return { id: executor.id, status: "ok", detail: executor.command };
  }

  if (executor.kind === "opencode") {
    return { id: executor.id, status: "warning", detail: `${executor.command} not installed` };
  }

  return { id: executor.id, status: "error", detail: `${executor.command || "command"} not installed` };
}

function checkRule(rule) {
  return {
    id: rule.id,
    status: rule.enabled ? "ok" : "warning",
    detail: rule.enabled ? "enabled" : "disabled"
  };
}

export async function getHealthReport(registry) {
  const sourceChecks = await Promise.all((registry.sources || []).map(checkSource));
  const executorChecks = (registry.executors || []).map(checkExecutor);
  const ruleChecks = (registry.rules || []).map(checkRule);

  const hasError = [...sourceChecks, ...executorChecks, ...ruleChecks].some((item) => item.status === "error");

  return {
    ok: !hasError,
    status: hasError ? "error" : "ok",
    now: new Date().toISOString(),
    checks: {
      sources: sourceChecks,
      executors: executorChecks,
      rules: ruleChecks
    }
  };
}
