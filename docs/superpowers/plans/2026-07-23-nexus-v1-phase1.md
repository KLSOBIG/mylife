# Nexus V1 Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Nexus 从静态展示骨架推进到“一期可用单用户 Web 产品”，完成本地持久化、任务流转、对话驱动和模块级交互闭环。

**Architecture:** 继续使用 `Vite + React + TypeScript` 单页应用，所有业务状态集中到前端 domain store，并持久化到 `localStorage`。UI 分为应用壳层、对话/命令入口、模块页面三层；对话和命令面板只生成 domain action，不直接写页面状态，保证后续接真实后端时边界稳定。

**Tech Stack:** React 19, TypeScript, Vite 6, Vitest, Testing Library, localStorage persistence

**Status:** Completed on 2026-07-23

---

## 实现边界

- 一期仍然只做单用户 `Web SPA`
- 数据保存在浏览器 `localStorage`
- 规则、信息源、执行器全部用 mock 数据，但交互真实
- 不做真实钉钉接入、模型调用、Agent 执行、服务端同步
- 但任务状态流、规则开关、工作空间切换、对话创建、命令面板、快捷键全部要能用

## 文件结构

- Modify: `src/domain/types.ts`
- Modify: `src/domain/mock-data.ts`
- Modify: `src/domain/store.ts`
- Create: `src/domain/persistence.ts`
- Create: `src/domain/intents.ts`
- Create: `src/domain/persistence.test.ts`
- Create: `src/domain/intents.test.ts`
- Modify: `src/app/app.tsx`
- Modify: `src/app/app.test.tsx`
- Create: `src/app/layout/command-palette.tsx`
- Modify: `src/app/layout/chat-panel.tsx`
- Modify: `src/app/layout/detail-panel.tsx`
- Modify: `src/app/layout/header.tsx`
- Modify: `src/app/layout/sidebar.tsx`
- Modify: `src/features/events/events-page.tsx`
- Modify: `src/features/tasks/tasks-page.tsx`
- Modify: `src/features/tasks/task-detail.tsx`
- Modify: `src/features/rules/rules-page.tsx`
- Modify: `src/features/sources/sources-page.tsx`
- Modify: `src/features/workspaces/workspace-switcher.tsx`
- Create: `src/features/common/dialog.tsx`
- Create: `src/features/common/empty-state.tsx`
- Modify: `src/styles/app.css`
- Modify: `README.md`
- Modify: `DESIGN.md`

---

### Task 1: 数据层升级为可持久化应用状态

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/mock-data.ts`
- Modify: `src/domain/store.ts`
- Create: `src/domain/persistence.ts`
- Create: `src/domain/persistence.test.ts`

- [x] **Step 1: 扩展领域类型**

```ts
export interface AppData {
  workspaces: Workspace[];
  events: EventItem[];
  tasks: TaskItem[];
  executors: ExecutorItem[];
  rules: RuleItem[];
  sources: SourceItem[];
  chatMessages: ChatMessage[];
}

export interface AppState {
  currentPage: PageId;
  currentWorkspaceId: string;
  selectedEventId?: string;
  selectedTaskId?: string;
  chatOpen: boolean;
  chatPinned: boolean;
  chatMode: "side" | "modal";
  commandPaletteOpen: boolean;
  eventFilter: "all" | AttentionLevel;
  eventSourceFilter: "all" | string;
  eventQuery: string;
  taskView: "kanban" | "list";
}
```

- [x] **Step 2: 让 store 同时管理 UI state 和 data state**

```ts
export interface AppModel {
  state: AppState;
  data: AppData;
}
```

- [x] **Step 3: 增加 localStorage 持久化**

```ts
const STORAGE_KEY = "nexus.v1.phase1";

export function loadAppModel(storage?: Storage): AppModel {
  // 先读本地，没有则回退 mock data
}

export function saveAppModel(model: AppModel, storage?: Storage) {
  // 只存 data + state，排除瞬时 UI 不必要字段也可以
}
```

- [x] **Step 4: 写持久化测试**

```ts
it("loads default model when storage is empty", () => {
  expect(loadAppModel(window.localStorage).data.tasks.length).toBeGreaterThan(0);
});

it("persists changed task status", () => {
  const model = loadAppModel(window.localStorage);
  model.data.tasks[0]!.status = "completed";
  saveAppModel(model, window.localStorage);
  expect(loadAppModel(window.localStorage).data.tasks[0]!.status).toBe("completed");
});
```

- [x] **Step 5: 验证数据层**

Run: `pnpm test -- src/domain/store.test.ts src/domain/persistence.test.ts`

Expected: PASS

---

### Task 2: 应用壳交互闭环

**Files:**
- Modify: `src/app/app.tsx`
- Modify: `src/app/layout/header.tsx`
- Modify: `src/app/layout/chat-panel.tsx`
- Create: `src/app/layout/command-palette.tsx`
- Create: `src/features/common/dialog.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/app/app.test.tsx`

- [x] **Step 1: 在 App 中接入 load/save**

```tsx
const [model, dispatch] = useReducer(reduceModel, undefined, () => loadAppModel(window.localStorage));

useEffect(() => {
  saveAppModel(model, window.localStorage);
}, [model]);
```

- [x] **Step 2: 增加命令面板**

```tsx
<CommandPalette
  open={model.state.commandPaletteOpen}
  items={[
    { id: "go-dashboard", label: "打开仪表盘" },
    { id: "create-task", label: "创建任务" },
    { id: "toggle-chat", label: "切换对话面板" }
  ]}
/>
```

- [x] **Step 3: 增加快捷键**

```ts
// Cmd+K 命令面板
// Cmd+J 切换对话面板
// N 新建任务
// 1-6 切页面
// Esc 关闭 modal / palette / detail
```

- [x] **Step 4: 增加对话模式 side/modal 切换**

```tsx
<button onClick={() => dispatch({ type: "chat/modeChanged", mode: "side" })}>侧板</button>
<button onClick={() => dispatch({ type: "chat/modeChanged", mode: "modal" })}>弹窗</button>
```

- [x] **Step 5: 写壳层测试**

```tsx
it("opens command palette with meta+k", async () => {
  render(<App />);
  await user.keyboard("{Meta>}k{/Meta}");
  expect(screen.getByRole("dialog", { name: "命令面板" })).toBeInTheDocument();
});
```

- [x] **Step 6: 验证壳层**

Run: `pnpm test -- src/app/app.test.tsx`

Expected: PASS

---

### Task 3: 对话输入变成真实动作入口

**Files:**
- Create: `src/domain/intents.ts`
- Create: `src/domain/intents.test.ts`
- Modify: `src/app/layout/chat-panel.tsx`
- Modify: `src/app/app.tsx`

- [x] **Step 1: 写最小意图解析器**

```ts
export type ParsedIntent =
  | { kind: "create-task"; title: string; priority?: TaskItem["priority"] }
  | { kind: "switch-page"; page: PageId }
  | { kind: "create-rule"; title: string; conditionHint: string }
  | { kind: "unknown"; raw: string };
```

- [x] **Step 2: 支持 4 类自然语言**

```ts
"创建一个紧急任务，处理客户投诉"
"打开规则引擎"
"当收到紧急消息时，立即通知我"
"龙虾今天处理了多少任务"
```

- [x] **Step 3: 对话提交后写入 chat history + dispatch action**

```tsx
onSubmit={(message) => {
  const intent = parseIntent(message);
  dispatch({ type: "chat/messageSubmitted", message, intent });
}}
```

- [x] **Step 4: 写解析测试**

```ts
it("parses create task intent with urgent priority", () => {
  expect(parseIntent("创建一个紧急任务，处理客户投诉")).toEqual({
    kind: "create-task",
    title: "处理客户投诉",
    priority: "urgent"
  });
});
```

- [x] **Step 5: 验证对话入口**

Run: `pnpm test -- src/domain/intents.test.ts src/app/app.test.tsx`

Expected: PASS

---

### Task 4: 事件流补齐筛选和搜索

**Files:**
- Modify: `src/features/events/events-page.tsx`
- Modify: `src/domain/store.ts`
- Modify: `src/app/app.tsx`
- Modify: `src/app/app.test.tsx`

- [x] **Step 1: 增加来源筛选和搜索框**

```tsx
<select value={sourceFilter}>
  <option value="all">全部来源</option>
  <option value="钉钉">钉钉</option>
  <option value="邮件">邮件</option>
</select>

<input value={query} placeholder="搜索事件标题、发送人、标签" />
```

- [x] **Step 2: 过滤逻辑同时看 level/source/query**

```ts
const visible = events.filter((item) => {
  return matchesLevel && matchesSource && matchesQuery;
});
```

- [x] **Step 3: 点详情里支持“转为任务”**

```tsx
<button onClick={() => dispatch({ type: "event/convertedToTask", eventId })}>转为任务</button>
```

- [x] **Step 4: 写测试**

```tsx
it("filters events by source and query", async () => {
  render(<App />);
  // 选 邮件 + 搜索 客户
});
```

- [x] **Step 5: 验证事件流**

Run: `pnpm test -- src/app/app.test.tsx`

Expected: PASS

---

### Task 5: 任务页补齐看板/列表、创建、状态流转

**Files:**
- Modify: `src/features/tasks/tasks-page.tsx`
- Modify: `src/features/tasks/task-detail.tsx`
- Modify: `src/domain/store.ts`
- Modify: `src/app/app.tsx`
- Modify: `src/app/app.test.tsx`

- [x] **Step 1: 增加看板/列表切换**

```tsx
<button onClick={() => onViewChange("kanban")}>看板</button>
<button onClick={() => onViewChange("list")}>列表</button>
```

- [x] **Step 2: 增加新建任务 dialog**

```tsx
{open ? (
  <Dialog title="创建任务">
    <input aria-label="任务标题" />
    <select aria-label="优先级" />
    <button>创建</button>
  </Dialog>
) : null}
```

- [x] **Step 3: 在详情里提供状态流转按钮**

```tsx
<button onClick={() => onStatusChange(task.id, "assigned")}>标记已分配</button>
<button onClick={() => onStatusChange(task.id, "in_progress")}>开始处理</button>
<button onClick={() => onStatusChange(task.id, "completed")}>完成</button>
```

- [x] **Step 4: 增加分配执行器**

```tsx
<select value={task.assigneeId ?? ""} onChange={...}>
  <option value="">未分配</option>
</select>
```

- [x] **Step 5: 写测试**

```tsx
it("creates a task and shows it in task list", async () => {
  render(<App />);
  // 打开创建任务 -> 输入 -> 创建
});

it("updates task status from detail actions", async () => {
  render(<App />);
  // 打开任务详情 -> 点完成
});
```

- [x] **Step 6: 验证任务页**

Run: `pnpm test -- src/app/app.test.tsx`

Expected: PASS

---

### Task 6: 规则页补齐开关、建议、创建

**Files:**
- Modify: `src/features/rules/rules-page.tsx`
- Modify: `src/domain/mock-data.ts`
- Modify: `src/domain/store.ts`
- Modify: `src/app/app.tsx`

- [x] **Step 1: 增加 AI 建议规则区**

```tsx
<section>
  <h3>AI 建议规则</h3>
  <RuleSuggestionCard />
</section>
```

- [x] **Step 2: 启用/禁用改成真状态切换**

```tsx
onToggleRule(rule.id)
```

- [x] **Step 3: 支持“通过对话创建规则”按钮**

```tsx
<button onClick={openCreateRuleDialog}>+ 通过对话创建规则</button>
```

- [x] **Step 4: 写建议采纳/忽略交互**

```tsx
onAcceptSuggestion(...)
onDismissSuggestion(...)
```

- [x] **Step 5: 验证规则页**

Run: `pnpm test -- src/app/app.test.tsx`

Expected: PASS

---

### Task 7: 信息源页和工作空间页补基础管理动作

**Files:**
- Modify: `src/features/sources/sources-page.tsx`
- Modify: `src/features/workspaces/workspace-switcher.tsx`
- Modify: `src/domain/store.ts`
- Modify: `src/app/app.tsx`

- [x] **Step 1: 信息源页增加启用/禁用和配置占位弹窗**

```tsx
<button>启用/禁用</button>
<button>配置</button>
```

- [x] **Step 2: 工作空间切换器增加新建工作空间**

```tsx
<button>+ 新建工作空间</button>
```

- [x] **Step 3: 新建工作空间最小字段**

```tsx
name + kind + description
```

- [x] **Step 4: 新建后自动切换并隔离任务**

```ts
dispatch({ type: "workspace/created", workspace })
```

- [x] **Step 5: 验证工作空间动作**

Run: `pnpm test -- src/app/app.test.tsx`

Expected: PASS

---

### Task 8: 文档和验证收尾

**Files:**
- Modify: `README.md`
- Modify: `DESIGN.md`

- [x] **Step 1: README 增加一期功能列表**

```md
- localStorage 持久化
- 命令面板与快捷键
- 对话驱动任务/规则创建
- 任务看板/列表与状态流转
```

- [x] **Step 2: DESIGN.md 增加“一期已实现范围”**

```md
- 个人用户 Web SPA
- mock 数据 + 本地持久化
- 六大模块 UI 与基础交互
```

- [x] **Step 3: 全量验证**

Run: `pnpm test`

Run: `pnpm build`

Expected: 全部通过

---

## 自检

- 任务/执行器/规则/信息源/工作空间/对话引擎/前端 UI 一期交互均覆盖
- 仍未接真实插件、真实钉钉、服务端和多用户权限，符合一期边界
- 所有新增能力都以 `localStorage + domain action` 实现，后续可迁移
