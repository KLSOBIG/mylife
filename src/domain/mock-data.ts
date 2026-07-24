import type {
  AppData,
  AttentionLevel,
  ChatMessage,
  EventItem,
  ExecutionRun,
  ExecutorItem,
  RuleItem,
  RuleSuggestion,
  SourceItem,
  TaskItem,
  Workspace
} from "./types";

export const chartSeries = [42, 56, 33, 61, 48, 70, 58];
export const levelOrder: AttentionLevel[] = ["L3", "L2", "L1", "L0"];

export function createSeedData(): AppData {
  const workspaces: Workspace[] = [
    { id: "ws_personal", name: "个人空间", kind: "personal", description: "默认工作空间", icon: "◉" },
    { id: "ws_team", name: "团队空间", kind: "team", description: "多人协作项目", icon: "◆" },
    { id: "ws_study", name: "学习空间", kind: "study", description: "学习资料和读书笔记", icon: "▲" },
    { id: "ws_life", name: "生活空间", kind: "life", description: "健康、财务、社交", icon: "●" }
  ];

  const events: EventItem[] = [
    {
      id: "ev_1",
      workspaceId: "ws_personal",
      title: "服务器 CPU 告警，生产集群需要排查",
      source: "钉钉",
      sender: "监控机器人",
      level: "L3",
      summary: "包含关键词 故障/告警，必须人工确认处理路径。",
      happenedAt: "2026-07-23 09:12",
      tags: ["告警", "生产"]
    },
    {
      id: "ev_2",
      workspaceId: "ws_personal",
      title: "客户投诉邮件，要求今天给出答复",
      source: "邮件",
      sender: "客户成功团队",
      level: "L2",
      summary: "需要 AI 草拟回复，人类最终审批。",
      happenedAt: "2026-07-23 10:05",
      tags: ["客户", "回复"]
    },
    {
      id: "ev_3",
      workspaceId: "ws_personal",
      title: "AI 行业融资简报",
      source: "RSS",
      sender: "资讯订阅",
      level: "L1",
      summary: "适合摘要追踪，不需要即时动作。",
      happenedAt: "2026-07-23 08:30",
      tags: ["AI", "资讯"]
    },
    {
      id: "ev_4",
      workspaceId: "ws_personal",
      title: "产品群闲聊 87 条",
      source: "钉钉",
      sender: "产品群",
      level: "L0",
      summary: "默认归档，无需注意力消耗。",
      happenedAt: "2026-07-23 11:20",
      tags: ["群聊", "噪音"]
    },
    {
      id: "ev_5",
      workspaceId: "ws_team",
      title: "版本回归测试未通过",
      source: "Jenkins",
      sender: "CI",
      level: "L3",
      summary: "发布阻塞事件，需要立刻决策是否回滚。",
      happenedAt: "2026-07-23 14:00",
      tags: ["发布", "阻塞"]
    },
    {
      id: "ev_6",
      workspaceId: "ws_study",
      title: "新论文：Agent 协作评测框架",
      source: "RSS",
      sender: "ArXiv",
      level: "L1",
      summary: "适合加入学习追踪。",
      happenedAt: "2026-07-23 07:20",
      tags: ["论文", "Agent"]
    }
  ];

  const tasks: TaskItem[] = [
    {
      id: "task_1",
      workspaceId: "ws_personal",
      title: "处理服务器告警",
      description: "先确认是否误报，再决定是否拉起应急响应。",
      type: "event",
      priority: "urgent",
      level: "L3",
      status: "in_progress",
      assigneeId: "exec_kael",
      source: "钉钉",
      dueAt: "2026-07-23 10:00"
    },
    {
      id: "task_2",
      workspaceId: "ws_personal",
      title: "客户投诉邮件回复",
      description: "由龙虾草拟，人确认后发送。",
      type: "event",
      priority: "high",
      level: "L2",
      status: "pending_review",
      assigneeId: "exec_lobster",
      source: "邮件",
      dueAt: "2026-07-23 18:00"
    },
    {
      id: "task_3",
      workspaceId: "ws_personal",
      title: "追踪 AI 融资资讯",
      description: "每天聚合摘要，只有重大变化才提醒。",
      type: "event",
      priority: "medium",
      level: "L1",
      status: "assigned",
      assigneeId: "exec_lobster"
    },
    {
      id: "task_4",
      workspaceId: "ws_team",
      title: "修复回归测试失败",
      description: "定位失败用例并给出合并建议。",
      type: "action",
      priority: "urgent",
      level: "L3",
      status: "pending_assignment",
      source: "Jenkins"
    },
    {
      id: "task_5",
      workspaceId: "ws_team",
      title: "重构规则匹配模块",
      description: "由 Harness 完成首轮重构和测试补全。",
      type: "action",
      priority: "high",
      level: "L2",
      status: "in_progress",
      assigneeId: "exec_harness"
    },
    {
      id: "task_6",
      workspaceId: "ws_study",
      title: "整理 Agent 论文卡片",
      description: "按 benchmark / planner / evaluator 分类。",
      type: "action",
      priority: "medium",
      level: "L1",
      status: "completed"
    }
  ];

  const executors: ExecutorItem[] = [
    {
      id: "exec_lobster",
      workspaceId: "ws_personal",
      name: "龙虾",
      role: "信息 Agent",
      type: "agent",
      status: "busy",
      avatar: "🦞",
      capabilities: ["信息检索", "摘要生成", "资讯追踪"],
      successRate: 98,
      activeTasks: 3,
      completedToday: 12
    },
    {
      id: "exec_harness",
      workspaceId: "ws_team",
      name: "Harness",
      role: "代码 Agent",
      type: "agent",
      status: "busy",
      avatar: "🛠",
      capabilities: ["代码生成", "Bug 修复", "重构"],
      successRate: 95,
      activeTasks: 2,
      completedToday: 5
    },
    {
      id: "exec_codex",
      workspaceId: "ws_team",
      name: "Codex",
      role: "架构 Agent",
      type: "agent",
      status: "idle",
      avatar: "⚙️",
      capabilities: ["架构设计", "方案评审"],
      successRate: 92,
      activeTasks: 0,
      completedToday: 2
    },
    {
      id: "exec_opencode",
      workspaceId: "ws_team",
      name: "OpenCode",
      role: "通用代码执行",
      type: "agent",
      status: "idle",
      avatar: "⌘",
      capabilities: ["代码执行", "终端脚本", "任务回放"],
      successRate: 90,
      activeTasks: 0,
      completedToday: 0
    },
    {
      id: "exec_kael",
      workspaceId: "ws_personal",
      name: "Kael",
      role: "管理员",
      type: "human",
      status: "busy",
      avatar: "K",
      capabilities: ["决策审批", "任务分配", "规则配置"],
      successRate: 100,
      activeTasks: 2,
      completedToday: 6
    }
  ];

  const executionRuns: ExecutionRun[] = [
    {
      id: "run_1",
      workspaceId: "ws_personal",
      taskId: "task_2",
      executorId: "exec_lobster",
      status: "succeeded",
      trigger: "auto",
      startedAt: "2026-07-23 09:45",
      finishedAt: "2026-07-23 09:58",
      summary: "已生成客户投诉回复草稿，等待 Kael 审核。",
      logs: [
        { id: "run_1_log_1", at: "2026-07-23 09:45", level: "info", message: "龙虾已领取任务：客户投诉邮件回复" },
        { id: "run_1_log_2", at: "2026-07-23 09:52", level: "info", message: "已抽取客户诉求与上下文历史" },
        { id: "run_1_log_3", at: "2026-07-23 09:58", level: "success", message: "已输出回复草稿，进入待审核" }
      ]
    }
  ];

  const rules: RuleItem[] = [
    {
      id: "rule_1",
      workspaceId: "ws_personal",
      name: "紧急事件自动升级",
      description: "故障、宕机、告警类消息立即升为 L3。",
      level: "L3",
      enabled: true,
      condition: '关键词包含 "故障" OR "告警" OR "@Kael"',
      action: "设置为 L3，立即通知 Kael",
      triggeredCount: 23,
      successRate: 100
    },
    {
      id: "rule_2",
      workspaceId: "ws_personal",
      name: "AI 资讯追踪",
      description: "RSS 中 AI 资讯自动归为追踪任务。",
      level: "L1",
      enabled: true,
      condition: '来源=RSS AND 关键词包含 "AI"',
      action: "设置为 L1，分配给龙虾",
      triggeredCount: 89,
      successRate: 95
    },
    {
      id: "rule_3",
      workspaceId: "ws_team",
      name: "代码任务分发",
      description: "Bug 和代码重构默认给 Harness。",
      level: "L2",
      enabled: true,
      condition: '标签包含 "代码" OR "Bug"',
      action: "设置为 L2，分配给 Harness",
      triggeredCount: 18,
      successRate: 95
    }
  ];

  const ruleSuggestions: RuleSuggestion[] = [
    {
      id: "suggestion_1",
      workspaceId: "ws_personal",
      title: "周报提醒自动归档",
      description: "你总是周五处理周报，建议其他时间自动归档。",
      confidence: 85,
      condition: '来源=邮件 AND 标题包含 "周报"',
      action: "非周五时归档为 L0"
    },
    {
      id: "suggestion_2",
      workspaceId: "ws_personal",
      title: "产品群消息自动摘要",
      description: "产品群消息较多，建议 AI 自动摘要后再推送。",
      confidence: 90,
      condition: '来源=钉钉 AND 发送人=产品群',
      action: "设置为 L1，交给龙虾摘要"
    }
  ];

  const sources: SourceItem[] = [
    {
      id: "source_1",
      workspaceId: "ws_personal",
      name: "钉钉",
      kind: "webhook",
      status: "connected",
      enabled: true,
      icon: "钉",
      description: "接收群消息和 @ 事件，进入注意力分流。",
      stat: "今日接收 112 条"
    },
    {
      id: "source_2",
      workspaceId: "ws_personal",
      name: "邮件",
      kind: "api",
      status: "connected",
      enabled: true,
      icon: "邮",
      description: "客户和系统邮件统一转任务。",
      stat: "今日接收 18 封"
    },
    {
      id: "source_email_local",
      workspaceId: "ws_personal",
      name: "Local Email Inbox",
      kind: "api",
      status: "connected",
      enabled: true,
      icon: "邮",
      description: "本地 JSON inbox 轮询，模拟真实邮件接入。",
      stat: "可手动同步"
    },
    {
      id: "source_3",
      workspaceId: "ws_study",
      name: "RSS",
      kind: "polling",
      status: "connected",
      enabled: true,
      icon: "订",
      description: "30 分钟轮询，抓 AI/论文资讯。",
      stat: "今日抓取 42 条"
    },
    {
      id: "source_dingtalk_webhook",
      workspaceId: "ws_team",
      name: "DingTalk Webhook",
      kind: "webhook",
      status: "connected",
      enabled: true,
      icon: "钉",
      description: "真实 webhook 接线，接告警和 @ 消息。",
      stat: "等待 webhook"
    },
    {
      id: "source_4",
      workspaceId: "ws_team",
      name: "Harness CLI",
      kind: "cli",
      status: "warning",
      enabled: true,
      icon: "终",
      description: "本地执行器命令入口，需关注超时。",
      stat: "2 个任务运行中"
    }
  ];

  const chatMessages: ChatMessage[] = [
    { id: "msg_1", role: "ai", content: "今日有 2 条 L3 事件必须你处理：服务器告警、回归测试阻塞。" },
    { id: "msg_2", role: "ai", content: "你可以直接说：创建一个紧急任务，处理客户投诉。" },
    { id: "msg_3", role: "user", content: "把所有 AI 融资资讯交给龙虾追踪。" },
    { id: "msg_4", role: "ai", content: "已创建规则：来源 RSS 且关键词包含 AI/融资 → L1 → 分配给龙虾。" }
  ];

  return {
    workspaces,
    events,
    tasks,
    executors,
    executionRuns,
    rules,
    ruleSuggestions,
    sources,
    chatMessages
  };
}

export const appData = createSeedData();
export const workspaces = appData.workspaces;
export const events = appData.events;
export const tasks = appData.tasks;
export const executors = appData.executors;
export const executionRuns = appData.executionRuns;
export const rules = appData.rules;
export const ruleSuggestions = appData.ruleSuggestions;
export const sources = appData.sources;
export const chatMessages = appData.chatMessages;
