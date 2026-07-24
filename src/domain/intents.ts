import type { PageId, TaskItem } from "./types";

ensureBrowserApis();

export type ParsedIntent =
  | { kind: "create-task"; title: string; priority?: TaskItem["priority"] }
  | { kind: "switch-page"; page: PageId }
  | { kind: "create-rule"; title: string; conditionHint: string }
  | { kind: "unknown"; raw: string };

export function parseIntent(raw: string): ParsedIntent {
  const text = raw.trim();
  if (!text) {
    return { kind: "unknown", raw };
  }

  const taskIntent = parseCreateTaskIntent(text);
  if (taskIntent) {
    return taskIntent;
  }

  const pageIntent = parseSwitchPageIntent(text);
  if (pageIntent) {
    return pageIntent;
  }

  const ruleIntent = parseCreateRuleIntent(text);
  if (ruleIntent) {
    return ruleIntent;
  }

  return { kind: "unknown", raw };
}

function parseCreateTaskIntent(text: string): ParsedIntent | undefined {
  if (!/(创建|新建|添加|安排|做个|生成|帮我|请帮我)/i.test(text)) {
    return undefined;
  }

  const priority = detectPriority(text);
  const title = stripLeadingTaskVerb(text);

  if (!title) {
    return undefined;
  }

  return {
    kind: "create-task",
    title,
    ...(priority ? { priority } : {})
  };
}

function parseSwitchPageIntent(text: string): ParsedIntent | undefined {
  const normalized = text.replace(/\s+/g, "");
  if (!/(打开|切换|进入|去|跳到|查看|显示)/.test(normalized)) {
    return undefined;
  }

  const entries: Array<[string[], PageId]> = [
    [["仪表盘", "dashboard", "首页", "看板"], "dashboard"],
    [["事件流", "事件", "告警"], "events"],
    [["任务", "task"], "tasks"],
    [["执行器", "executor", "agents", "agent", "执行"], "executors"],
    [["规则引擎", "规则"], "rules"],
    [["信息源", "sources", "source", "来源"], "sources"],
    [["插件", "plugin", "plugins"], "plugins"]
  ];

  for (const [keywords, page] of entries) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return { kind: "switch-page", page };
    }
  }

  return undefined;
}

function parseCreateRuleIntent(text: string): ParsedIntent | undefined {
  const match = text.match(/^(?:当|如果|若|当有|如果有)(.+?)(?:时|的时候)[，,：:]?(.*)$/);
  if (!match) {
    return undefined;
  }

  const conditionHint = match[1]?.trim();
  const title = match[2]?.trim() || "新规则";

  if (!conditionHint || !/(规则|通知|提醒|自动|立即|时)/.test(text)) {
    return undefined;
  }

  return {
    kind: "create-rule",
    title,
    conditionHint
  };
}

function detectPriority(text: string): TaskItem["priority"] | undefined {
  if (/(紧急|urgent|最高优先级|高优先级)/i.test(text)) {
    return "urgent";
  }
  if (/(高优先级|重要|尽快|high)/i.test(text)) {
    return "high";
  }
  if (/(低优先级|low)/i.test(text)) {
    return "low";
  }
  if (/(中优先级|medium)/i.test(text)) {
    return "medium";
  }
  return undefined;
}

function stripLeadingTaskVerb(text: string): string {
  const cleaned = text
    .replace(/^(请|帮我|麻烦我|麻烦帮我|你帮我)?/u, "")
    .replace(/^(创建|新建|添加|安排|处理|做个|生成)(一个|个)?(紧急|高优先级|中优先级|低优先级)?(任务)?[，,：:\s]*/u, "")
    .replace(/^(一个|个)?(紧急|高优先级|中优先级|低优先级)?(任务)?[，,：:\s]*/u, "")
    .trim();

  const parts = cleaned.split(/[，,：:]/u).map((part) => part.trim()).filter(Boolean);
  return parts[0] ?? cleaned;
}

function ensureBrowserApis(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!window.localStorage || typeof window.localStorage.clear !== "function") {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createStorageMock()
    });
  }
}

function createStorageMock(): Storage {
  const entries = new Map<string, string>();

  return {
    length: 0,
    clear() {
      entries.clear();
    },
    getItem(key: string) {
      return entries.has(key) ? entries.get(key)! : null;
    },
    key(index: number) {
      return Array.from(entries.keys())[index] ?? null;
    },
    removeItem(key: string) {
      entries.delete(key);
    },
    setItem(key: string, value: string) {
      entries.set(key, value);
    }
  } as Storage;
}
