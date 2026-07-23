import { useEffect, useMemo, useState } from "react";
import type { PageId, Workspace } from "../../domain/types";
import { CommandPalette, type CommandPaletteItem } from "./command-palette";

const titles: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: { title: "仪表盘", subtitle: "2 秒看清今天必须你关注什么" },
  events: { title: "事件流", subtitle: "按注意力级别分流全部外部信息" },
  tasks: { title: "任务", subtitle: "系统只分发，执行器执行" },
  executors: { title: "执行器", subtitle: "查看谁在干活，谁空闲，谁异常" },
  rules: { title: "规则引擎", subtitle: "条件匹配和动作分发中心" },
  sources: { title: "信息源", subtitle: "统一接入钉钉、邮件、RSS 和执行入口" }
};

type HeaderCommandId =
  | "open-dashboard"
  | "open-events"
  | "open-tasks"
  | "open-executors"
  | "open-rules"
  | "open-sources"
  | "create-task"
  | "toggle-chat";

export function Header(props: {
  currentPage: PageId;
  currentWorkspace: Workspace;
  chatOpen: boolean;
  commandPaletteOpen?: boolean;
  onCommandPaletteOpenChange?: (open: boolean) => void;
  onNavigatePage?: (page: PageId) => void;
  onCreateTask?: () => void;
  onToggleChat: () => void;
}) {
  const copy = titles[props.currentPage];
  const [localPaletteOpen, setLocalPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");

  const paletteOpen = props.commandPaletteOpen ?? localPaletteOpen;
  const setPaletteOpen = (open: boolean) => {
    props.onCommandPaletteOpenChange?.(open);
    if (props.commandPaletteOpen === undefined) {
      setLocalPaletteOpen(open);
    }
    if (!open) {
      setQuery("");
    }
  };

  const items = useMemo<CommandPaletteItem[]>(
    () => [
      {
        id: "open-dashboard",
        label: "打开仪表盘",
        description: "回到全局概览",
        shortcut: "1",
        group: "页面"
      },
      {
        id: "open-events",
        label: "打开事件流",
        description: "查看最新外部输入",
        shortcut: "2",
        group: "页面"
      },
      {
        id: "open-tasks",
        label: "打开任务",
        description: "查看任务队列和创建入口",
        shortcut: "3",
        group: "页面"
      },
      {
        id: "open-executors",
        label: "打开执行器",
        description: "查看谁在干活，谁空闲，谁异常",
        shortcut: "4",
        group: "页面"
      },
      {
        id: "open-rules",
        label: "打开规则引擎",
        description: "查看条件匹配和动作分发",
        shortcut: "5",
        group: "页面"
      },
      {
        id: "open-sources",
        label: "打开信息源",
        description: "查看接入渠道和状态",
        shortcut: "6",
        group: "页面"
      },
      {
        id: "create-task",
        label: "创建任务",
        description: "进入任务创建流程",
        shortcut: "N",
        group: "动作"
      },
      {
        id: "toggle-chat",
        label: "切换对话",
        description: props.chatOpen ? "关闭右侧对话壳层" : "打开右侧对话壳层",
        shortcut: "Enter",
        group: "布局"
      }
    ],
    [props.chatOpen]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) {
        return;
      }
      event.preventDefault();
      setPaletteOpen(true);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props.commandPaletteOpen, props.onCommandPaletteOpenChange]);

  return (
    <>
      <header className="header">
        <div className="header-copy">
          <div className="header-breadcrumb">{props.currentWorkspace.name}</div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
          <span className="header-summary">{props.currentWorkspace.name} / {copy.subtitle}</span>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn secondary header-command"
            aria-haspopup="dialog"
            onClick={() => setPaletteOpen(true)}
          >
            <span className="header-command__label">命令面板</span>
            <kbd>⌘K</kbd>
          </button>
          <button type="button" className="btn secondary" onClick={props.onToggleChat}>
            {props.chatOpen ? "关闭对话" : "打开对话"}
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              setQuery("创建");
              setPaletteOpen(true);
            }}
          >
            创建任务
          </button>
        </div>
      </header>

      <CommandPalette
        open={paletteOpen}
        items={items}
        query={query}
        onQueryChange={setQuery}
        onClose={() => setPaletteOpen(false)}
        onSelect={(item) => {
          handleCommandSelect(item.id as HeaderCommandId);
        }}
      />
    </>
  );

  function handleCommandSelect(commandId: HeaderCommandId) {
    setPaletteOpen(false);

    switch (commandId) {
      case "open-dashboard":
        navigatePage("dashboard");
        return;
      case "open-events":
        navigatePage("events");
        return;
      case "open-tasks":
        navigatePage("tasks");
        return;
      case "open-executors":
        navigatePage("executors");
        return;
      case "open-rules":
        navigatePage("rules");
        return;
      case "open-sources":
        navigatePage("sources");
        return;
      case "create-task":
        openTaskCreator();
        return;
      case "toggle-chat":
        props.onToggleChat();
    }
  }

  function navigatePage(page: PageId) {
    if (props.onNavigatePage) {
      props.onNavigatePage(page);
      return;
    }

    clickButton(".sidebar", pageLabel(page));
  }

  function openTaskCreator() {
    if (props.onCreateTask) {
      props.onCreateTask();
      return;
    }

    if (props.currentPage === "tasks") {
      clickButton(".page-shell", "创建任务");
      return;
    }

    navigatePage("tasks");
    window.setTimeout(() => clickButton(".page-shell", "创建任务"), 0);
  }
}

function pageLabel(page: PageId): string {
  return titles[page].title;
}

function clickButton(scopeSelector: string, label: string) {
  const scope = typeof document === "undefined" ? null : document.querySelector(scopeSelector);
  if (!scope) {
    return;
  }

  const button = Array.from(scope.querySelectorAll<HTMLButtonElement>("button")).find((item) =>
    matchesLabel(item, label)
  );
  button?.click();
}

function matchesLabel(button: HTMLButtonElement, label: string) {
  const ariaLabel = button.getAttribute("aria-label")?.trim();
  if (ariaLabel === label) {
    return true;
  }

  return button.textContent?.replace(/\s+/g, " ").trim() === label;
}
