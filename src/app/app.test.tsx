import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EventItem } from "../domain/types";
import { App } from "./app";

const {
  fetchPluginRegistryMock,
  syncRealSourceMock,
  runExternalExecutorMock,
  evaluateEventRulesMock
} = vi.hoisted(() => ({
  fetchPluginRegistryMock: vi.fn(),
  syncRealSourceMock: vi.fn(),
  runExternalExecutorMock: vi.fn(),
  evaluateEventRulesMock: vi.fn()
}));

vi.mock("../domain/gateway", () => ({
  fetchPluginRegistry: fetchPluginRegistryMock,
  syncRealSource: syncRealSourceMock,
  runExternalExecutor: runExternalExecutorMock,
  evaluateEventRules: evaluateEventRulesMock
}));

beforeEach(() => {
  fetchPluginRegistryMock.mockResolvedValue({ sources: [], executors: [], rules: [] });
  syncRealSourceMock.mockResolvedValue({ events: [] });
  runExternalExecutorMock.mockResolvedValue({
    summary: "外部执行完成",
    log: "外部执行完成",
    raw: "{}"
  });
  evaluateEventRulesMock.mockResolvedValue({
    matchedRules: [],
    actions: [],
    summary: ""
  });
});

describe("App", () => {
  it("renders dashboard by default", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "仪表盘" })).toBeInTheDocument();
    expect(screen.getByText("今日接收事件数")).toBeInTheDocument();
  });

  it("opens events from dashboard shortcuts and selects recent event", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getAllByRole("button", { name: "查看详情" })[0]);
    expect(screen.getByRole("heading", { name: "事件流" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "仪表盘" }));
    await user.click(screen.getByRole("button", { name: /服务器 CPU 告警，生产集群需要排查/ }));
    expect(screen.getByRole("heading", { name: "事件流" })).toBeInTheDocument();
    const detailPanel = document.querySelector(".detail-panel.open");
    expect(detailPanel).not.toBeNull();
    expect(within(detailPanel as HTMLElement).getByText("服务器 CPU 告警，生产集群需要排查")).toBeInTheDocument();
  });

  it("opens executors from dashboard manage action", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "管理" }));
    expect(screen.getByRole("heading", { name: "执行器" })).toBeInTheDocument();
  });

  it("switches workspace and updates title", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /个人空间 工作空间切换/ }));
    await user.click(screen.getByRole("button", { name: /团队空间/ }));
    expect(screen.getByText(/团队空间 \/ 2 秒看清今天必须你关注什么/)).toBeInTheDocument();
  });

  it("filters events by attention level", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "事件流" }));
    await user.click(screen.getByRole("button", { name: "L3" }));
    expect(screen.getByText("服务器 CPU 告警，生产集群需要排查")).toBeInTheDocument();
    expect(screen.queryByText("客户投诉邮件，要求今天给出答复")).not.toBeInTheDocument();
  });

  it("filters events by source and query", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "事件流" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "事件来源筛选" }), "邮件");
    await user.type(screen.getByRole("textbox", { name: "搜索事件" }), "客户");
    expect(screen.getByText("客户投诉邮件，要求今天给出答复")).toBeInTheDocument();
    expect(screen.queryByText("服务器 CPU 告警，生产集群需要排查")).not.toBeInTheDocument();
  });

  it("opens task detail in right panel", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "任务" }));
    await user.click(screen.getByRole("button", { name: /处理服务器告警/ }));
    const detailPanel = document.querySelector(".detail-panel.open");
    expect(detailPanel).not.toBeNull();
    expect(within(detailPanel as HTMLElement).getByText("任务详情")).toBeInTheDocument();
    expect(
      within(detailPanel as HTMLElement).getByText("先确认是否误报，再决定是否拉起应急响应。")
    ).toBeInTheDocument();
  });

  it("assigns executor from task detail", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "任务" }));
    await user.click(screen.getByRole("button", { name: /处理服务器告警/ }));
    await user.selectOptions(screen.getByRole("combobox", { name: "执行器" }), "exec_lobster");
    expect(screen.getByRole("combobox", { name: "执行器" })).toHaveValue("exec_lobster");
  });

  it("switches task view to list mode", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "任务" }));
    await user.click(screen.getByRole("button", { name: "列表" }));
    expect(screen.getByRole("button", { name: "列表" })).toHaveAttribute("aria-pressed", "true");
  });

  it("converts an event into a task from detail", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "事件流" }));
    await user.click(screen.getByRole("button", { name: /客户投诉邮件，要求今天给出答复/ }));
    await user.click(screen.getByRole("button", { name: "转为任务" }));
    expect(screen.getByRole("heading", { name: "任务" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /客户投诉邮件，要求今天给出答复/ })).toBeInTheDocument();
  });

  it("opens command palette with meta+k and switches page", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard("{Meta>}k{/Meta}");
    const dialog = screen.getByRole("dialog", { name: "命令面板" });
    await user.click(within(dialog).getByRole("button", { name: "打开任务" }));
    expect(screen.getByRole("heading", { name: "任务" })).toBeInTheDocument();
  });

  it("creates a task from chat input", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "打开对话" }));
    const input = screen.getByRole("textbox", { name: "对话输入框" });
    await user.type(input, "创建一个紧急任务，跟进老板邮件{enter}");
    await user.click(screen.getByRole("button", { name: "任务" }));
    expect(screen.getByRole("button", { name: /跟进老板邮件/ })).toBeInTheDocument();
  });

  it("keeps chat panel closed by default", () => {
    render(<App />);
    expect(screen.queryByRole("textbox", { name: "对话输入框" })).not.toBeInTheDocument();
  });

  it("switches chat panel to modal mode", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "打开对话" }));
    await user.click(screen.getByRole("button", { name: "弹窗" }));
    expect(screen.getByRole("dialog", { name: "对话引擎" })).toBeInTheDocument();
  });

  it("opens task creator from header instead of creating task immediately", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "+ 新建任务" }));
    expect(screen.getByRole("dialog", { name: "创建任务" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^新任务$/ })).not.toBeInTheDocument();
  });

  it("creates workspace and switches to it", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /个人空间 工作空间切换/ }));
    await user.click(screen.getByRole("button", { name: "新建工作空间" }));
    await user.type(screen.getByRole("textbox", { name: "工作空间名称" }), "实验空间");
    await user.type(screen.getByRole("textbox", { name: "工作空间描述" }), "命令面板和规则实验");
    await user.click(screen.getByRole("button", { name: "创建工作空间" }));
    expect(screen.getByText(/实验空间 \/ 2 秒看清今天必须你关注什么/)).toBeInTheDocument();
  });

  it("toggles rule state", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "规则引擎" }));
    await user.click(screen.getByRole("button", { name: "切换规则 紧急事件自动升级" }));
    expect(screen.getByText("已停用")).toBeInTheDocument();
  });

  it("keeps executor runtime metrics unchanged before execution starts", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "任务" }));
    await user.click(screen.getByRole("button", { name: /处理服务器告警/ }));
    await user.selectOptions(screen.getByRole("combobox", { name: "执行器" }), "exec_lobster");
    await user.click(screen.getByRole("button", { name: "执行器" }));

    const lobsterCard = screen.getByText("龙虾").closest(".entity-card");
    expect(lobsterCard).not.toBeNull();
    expect(within(lobsterCard as HTMLElement).getByText("今日完成")).toBeInTheDocument();
    expect(within(lobsterCard as HTMLElement).getByText("已生成客户投诉回复草稿，等待 Kael 审核。")).toBeInTheDocument();
  });

  it("starts local execution from task detail", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "任务" }));
    await user.click(screen.getByRole("button", { name: /追踪 AI 融资资讯/ }));
    await user.click(screen.getByRole("button", { name: "开始执行" }));
    expect(screen.getByText("运行状态：queued")).toBeInTheDocument();
    expect(await screen.findByText("运行状态：running")).toBeInTheDocument();
  });

  it("marks execution success and moves task to pending review", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "任务" }));
    await user.click(screen.getByRole("button", { name: /追踪 AI 融资资讯/ }));
    await user.click(screen.getByRole("button", { name: "开始执行" }));
    await screen.findByText("运行状态：running");
    await user.click(screen.getByRole("button", { name: "标记成功" }));
    expect(screen.getByText("运行状态：succeeded")).toBeInTheDocument();
    expect(screen.getByText("状态：pending_review")).toBeInTheDocument();
  });

  it("marks execution failure and updates executor board", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "任务" }));
    await user.click(screen.getByRole("button", { name: /追踪 AI 融资资讯/ }));
    await user.click(screen.getByRole("button", { name: "开始执行" }));
    await screen.findByText("运行状态：running");
    await user.click(screen.getByRole("button", { name: "标记失败" }));
    expect(screen.getByText("运行状态：failed")).toBeInTheDocument();
    expect(screen.getByText("状态：returned")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "执行器" }));

    const lobsterCard = screen.getByText("龙虾").closest(".entity-card");
    expect(lobsterCard).not.toBeNull();
    expect(within(lobsterCard as HTMLElement).getByText("失败次数")).toBeInTheDocument();
    expect(within(lobsterCard as HTMLElement).getByText("龙虾 执行 追踪 AI 融资资讯 失败，任务已退回。")).toBeInTheDocument();
  });

  it("opens plugins page from sidebar", async () => {
    const user = userEvent.setup();
    fetchPluginRegistryMock.mockResolvedValue({
      sources: [
        {
          id: "source_3",
          pluginId: "rss.arxiv.cs-ai",
          workspaceId: "ws_study",
          kind: "polling",
          name: "ArXiv RSS",
          enabled: true,
          health: { status: "ok" }
        }
      ],
      executors: [],
      rules: [
        {
          id: "rule_plugin_1",
          pluginId: "rule.ai-brief",
          workspaceId: "ws_personal",
          kind: "rule",
          name: "AI 资讯规则",
          enabled: true,
          health: { status: "warning", message: "等待首次命中" }
        }
      ]
    });

    render(<App />);
    await user.click(screen.getByRole("button", { name: "插件" }));
    expect(screen.getByRole("heading", { level: 1, name: "插件" })).toBeInTheDocument();
    expect(await screen.findByText("AI 资讯规则")).toBeInTheDocument();
  });

  it("syncs real source and applies rule actions into task queue", async () => {
    const user = userEvent.setup();
    const syncedEvent: EventItem = {
      id: "ev_sync_1",
      workspaceId: "ws_study",
      title: "新论文：Agent 路由评测",
      source: "ArXiv RSS",
      sender: "ArXiv RSS",
      level: "L1",
      summary: "论文摘要",
      happenedAt: "2026-07-24 10:00",
      tags: ["论文", "Agent", "RSS"]
    };

    fetchPluginRegistryMock.mockResolvedValue({
      sources: [
        {
          id: "source_3",
          pluginId: "rss.arxiv.cs-ai",
          workspaceId: "ws_study",
          kind: "polling",
          name: "ArXiv RSS",
          enabled: true,
          health: { status: "ok" }
        }
      ],
      executors: [
        {
          id: "exec_lobster",
          pluginId: "cli.lobster",
          workspaceId: "ws_study",
          kind: "cli",
          name: "龙虾 CLI",
          enabled: true,
          health: { status: "ok" }
        }
      ],
      rules: []
    });
    syncRealSourceMock.mockResolvedValue({ events: [syncedEvent] });
    evaluateEventRulesMock.mockResolvedValue({
      matchedRules: [{ id: "rule_paper", name: "论文自动建任务" }],
      summary: "命中 1 条规则",
      actions: [
        { type: "set_level", level: "L2" },
        { type: "create_task", title: "跟进论文：新论文：Agent 路由评测", priority: "high", status: "assigned" },
        { type: "assign_executor", executorId: "exec_lobster" },
        { type: "append_note", note: "已加入论文跟进队列" }
      ]
    });

    render(<App />);
    await user.click(screen.getByRole("button", { name: /个人空间 工作空间切换/ }));
    await user.click(screen.getByRole("button", { name: /学习空间/ }));
    await user.click(screen.getByRole("button", { name: "信息源" }));
    await user.click(screen.getByRole("button", { name: "真实同步" }));
    await user.click(screen.getByRole("button", { name: "任务" }));

    expect(await screen.findByRole("button", { name: /跟进论文：新论文：Agent 路由评测/ })).toBeInTheDocument();
    expect(evaluateEventRulesMock).toHaveBeenCalledWith(expect.objectContaining({ id: "ev_sync_1" }), "ws_study");
  });
});
