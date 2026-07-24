# Nexus V1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可运行的 Nexus v1 Web 单页应用，把现有产品文档中的核心模块落成可浏览、可切换、可操作的基础版本。

**Architecture:** 使用 `Vite + React + TypeScript` 构建前端单页应用。先以本地内存状态和文档中的预设数据驱动全部模块，做出完整信息架构、主交互、工作空间隔离、对话侧板和多页面视图；接口层先用纯前端 domain store 封装，为后续接 Go/服务端留边界。

**Tech Stack:** React 19, TypeScript, Vite 6, CSS Modules/Plain CSS, Vitest, Testing Library

---

## 实现边界

- 第一批只做 `Web SPA`
- 数据源先用本地 mock/domain store
- 不做真实钉钉、Agent CLI、规则执行、登录、权限
- 但页面结构、模块边界、状态流、文档命名全部按 `docs/DESIGN.md` 和 `docs/modules/*.md`

## 文件结构

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/styles/reset.css`
- Create: `src/styles/theme.css`
- Create: `src/styles/app.css`
- Create: `src/app/app.tsx`
- Create: `src/app/app.test.tsx`
- Create: `src/app/layout/sidebar.tsx`
- Create: `src/app/layout/header.tsx`
- Create: `src/app/layout/detail-panel.tsx`
- Create: `src/app/layout/chat-panel.tsx`
- Create: `src/domain/types.ts`
- Create: `src/domain/mock-data.ts`
- Create: `src/domain/store.ts`
- Create: `src/domain/store.test.ts`
- Create: `src/features/dashboard/dashboard-page.tsx`
- Create: `src/features/events/events-page.tsx`
- Create: `src/features/tasks/tasks-page.tsx`
- Create: `src/features/executors/executors-page.tsx`
- Create: `src/features/rules/rules-page.tsx`
- Create: `src/features/sources/sources-page.tsx`
- Create: `src/features/workspaces/workspace-switcher.tsx`
- Create: `src/features/tasks/task-detail.tsx`
- Create: `src/features/events/event-detail.tsx`
- Create: `src/test/setup.ts`
- Modify: `docs/DESIGN.md`
- Create: `README.md`

---

### Task 1: 搭项目骨架

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`

- [ ] **Step 1: 写 package.json**

```json
{
  "name": "nexus-v1",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^4.4.1",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.3",
    "vite": "^6.0.11",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: 写 TypeScript 和 Vite 配置**

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts"
  }
});
```

- [ ] **Step 3: 写入口 HTML**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nexus</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
  </html>
```

- [ ] **Step 4: 写 React 入口**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/app";
import "./styles/reset.css";
import "./styles/theme.css";
import "./styles/app.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 5: 验证项目可启动**

Run: `pnpm install`

Run: `pnpm build`

Expected: 构建成功，无缺失入口错误

---

### Task 2: 定义领域模型和文档驱动 mock 数据

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/mock-data.ts`
- Create: `src/domain/store.ts`
- Create: `src/domain/store.test.ts`

- [ ] **Step 1: 定义领域类型**

```ts
export type AttentionLevel = "L0" | "L1" | "L2" | "L3";
export type TaskStatus =
  | "pending_assignment"
  | "assigned"
  | "in_progress"
  | "pending_review"
  | "completed"
  | "suspended"
  | "escalated"
  | "returned";

export type WorkspaceKind = "personal" | "team" | "study" | "life";

export interface Workspace {
  id: string;
  name: string;
  kind: WorkspaceKind;
  description: string;
}

export interface EventItem {
  id: string;
  workspaceId: string;
  title: string;
  source: string;
  sender: string;
  level: AttentionLevel;
  summary: string;
  happenedAt: string;
  tags: string[];
}

export interface TaskItem {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  type: "event" | "action" | "system" | "plugin";
  priority: "urgent" | "high" | "medium" | "low";
  level: AttentionLevel;
  status: TaskStatus;
  assigneeId?: string;
  source?: string;
  dueAt?: string;
}
```

- [ ] **Step 2: 用文档内容生成预设数据**

```ts
export const workspaces = [
  { id: "ws_personal", name: "个人空间", kind: "personal", description: "默认工作空间" },
  { id: "ws_team", name: "团队空间", kind: "team", description: "多人协作项目" },
  { id: "ws_study", name: "学习空间", kind: "study", description: "学习资料和读书笔记" },
  { id: "ws_life", name: "生活空间", kind: "life", description: "健康、财务、社交" }
];
```

- [ ] **Step 3: 封装本地 store**

```ts
export interface AppState {
  currentPage: "dashboard" | "events" | "tasks" | "executors" | "rules" | "sources";
  currentWorkspaceId: string;
  selectedEventId?: string;
  selectedTaskId?: string;
  chatOpen: boolean;
  chatPinned: boolean;
}

export function createInitialState(): AppState {
  return {
    currentPage: "dashboard",
    currentWorkspaceId: "ws_personal",
    chatOpen: true,
    chatPinned: true
  };
}
```

- [ ] **Step 4: 写 store 测试**

```ts
it("switches workspace and clears selected detail", () => {
  const state = createInitialState();
  const next = reduceState(state, { type: "workspace/switched", workspaceId: "ws_team" });
  expect(next.currentWorkspaceId).toBe("ws_team");
  expect(next.selectedEventId).toBeUndefined();
  expect(next.selectedTaskId).toBeUndefined();
});
```

- [ ] **Step 5: 验证 store**

Run: `pnpm test -- src/domain/store.test.ts`

Expected: PASS

---

### Task 3: 搭建整体布局和主题系统

**Files:**
- Create: `src/styles/reset.css`
- Create: `src/styles/theme.css`
- Create: `src/styles/app.css`
- Create: `src/app/app.tsx`
- Create: `src/app/layout/sidebar.tsx`
- Create: `src/app/layout/header.tsx`
- Create: `src/app/layout/detail-panel.tsx`
- Create: `src/app/layout/chat-panel.tsx`

- [ ] **Step 1: 写主题变量**

```css
:root {
  --bg: #ffffff;
  --bg-soft: #f8f9fa;
  --bg-muted: #f1f3f5;
  --border: #e2e8f0;
  --text-strong: #111827;
  --text-body: #4b5563;
  --text-subtle: #9ca3af;
  --accent: #6d28d9;
  --accent-soft: rgba(109, 40, 217, 0.08);
  --l0: #9ca3af;
  --l1: #2563eb;
  --l2: #ca8a04;
  --l3: #dc2626;
}
```

- [ ] **Step 2: 写 app 骨架**

```tsx
export function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Header />
        <section className="app-content">{/* page outlet */}</section>
      </main>
      <DetailPanel />
      <ChatPanel />
    </div>
  );
}
```

- [ ] **Step 3: 左侧边栏按视觉稿拆块**

```tsx
<aside className="sidebar">
  <WorkspaceSwitcher />
  <nav>{/* 仪表盘 / 事件流 / 任务 / 执行器 / 规则 / 信息源 */}</nav>
</aside>
```

- [ ] **Step 4: 右侧细节面板和对话侧板先占位**

```tsx
<aside className={detailOpen ? "detail-panel open" : "detail-panel"} />
<aside className={chatOpen ? "chat-panel open" : "chat-panel"} />
```

- [ ] **Step 5: 验证布局**

Run: `pnpm build`

Expected: 应用能渲染三段式布局，无 CSS 变量缺失

---

### Task 4: 实现工作空间切换和页面导航

**Files:**
- Create: `src/features/workspaces/workspace-switcher.tsx`
- Modify: `src/app/app.tsx`
- Modify: `src/app/layout/sidebar.tsx`
- Test: `src/app/app.test.tsx`

- [ ] **Step 1: 写工作空间切换器**

```tsx
export function WorkspaceSwitcher(props: {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  onSwitch: (workspaceId: string) => void;
}) {
  // 展示当前空间 + dropdown + 其他空间列表
}
```

- [ ] **Step 2: 接入导航和页面切换状态**

```tsx
const navItems = [
  { id: "dashboard", label: "仪表盘" },
  { id: "events", label: "事件流" },
  { id: "tasks", label: "任务" },
  { id: "executors", label: "执行器" },
  { id: "rules", label: "规则引擎" },
  { id: "sources", label: "信息源" }
];
```

- [ ] **Step 3: 写切换测试**

```tsx
it("switches workspace and shows different workspace label", async () => {
  render(<App />);
  await user.click(screen.getByRole("button", { name: /个人空间/ }));
  await user.click(screen.getByRole("button", { name: /团队空间/ }));
  expect(screen.getByText("团队空间")).toBeInTheDocument();
});
```

- [ ] **Step 4: 验证导航**

Run: `pnpm test -- src/app/app.test.tsx`

Expected: PASS

---

### Task 5: 实现仪表盘和事件流页面

**Files:**
- Create: `src/features/dashboard/dashboard-page.tsx`
- Create: `src/features/events/events-page.tsx`
- Create: `src/features/events/event-detail.tsx`
- Modify: `src/app/app.tsx`
- Test: `src/app/app.test.tsx`

- [ ] **Step 1: 仪表盘按 docs/DESIGN.md 落四张统计卡 + 趋势 + Agent 状态**

```tsx
<section className="stats-row">
  <StatCard label="今日接收事件数" value="128" />
  <StatCard label="L3 必须你" value="2" />
  <StatCard label="Agent 处理中" value="7" />
  <StatCard label="AI 已完成" value="34" />
</section>
```

- [ ] **Step 2: 事件流按 L3/L2/L1/L0 过滤**

```tsx
const chips: AttentionLevel[] = ["L3", "L2", "L1", "L0"];
```

- [ ] **Step 3: 点事件打开右侧详情**

```tsx
onSelectEvent(event.id)
```

- [ ] **Step 4: 写页面测试**

```tsx
it("filters events by attention level", async () => {
  render(<App />);
  await user.click(screen.getByRole("button", { name: "事件流" }));
  await user.click(screen.getByRole("button", { name: "L3" }));
  expect(screen.getByText(/必须你/)).toBeInTheDocument();
});
```

- [ ] **Step 5: 验证页面**

Run: `pnpm test -- src/app/app.test.tsx`

Expected: PASS

---

### Task 6: 实现任务、执行器、规则、信息源页面

**Files:**
- Create: `src/features/tasks/tasks-page.tsx`
- Create: `src/features/tasks/task-detail.tsx`
- Create: `src/features/executors/executors-page.tsx`
- Create: `src/features/rules/rules-page.tsx`
- Create: `src/features/sources/sources-page.tsx`
- Modify: `src/app/app.tsx`

- [ ] **Step 1: 任务页实现看板视图**

```tsx
const columns = [
  { id: "pending_assignment", label: "待分配" },
  { id: "assigned", label: "已分配" },
  { id: "in_progress", label: "进行中" },
  { id: "pending_review", label: "待审核" },
  { id: "completed", label: "已完成" }
];
```

- [ ] **Step 2: 执行器页实现卡片栅格**

```tsx
<AgentCard name="龙虾" role="信息 Agent" status="空闲" />
```

- [ ] **Step 3: 规则页实现规则列表和开关**

```tsx
<RuleCard name="紧急事件自动升级" level="L3" enabled />
```

- [ ] **Step 4: 信息源页实现信息源卡片**

```tsx
<SourceCard name="钉钉" type="Webhook" status="已连接" />
```

- [ ] **Step 5: 验证页面渲染**

Run: `pnpm build`

Expected: 四个页面都能切换渲染，无运行时报错

---

### Task 7: 实现右侧详情和对话侧板

**Files:**
- Modify: `src/app/layout/detail-panel.tsx`
- Modify: `src/app/layout/chat-panel.tsx`
- Modify: `src/app/app.tsx`
- Test: `src/app/app.test.tsx`

- [ ] **Step 1: 详情面板根据当前选中实体切换**

```tsx
if (selectedEvent) return <EventDetail event={selectedEvent} />;
if (selectedTask) return <TaskDetail task={selectedTask} />;
return <EmptyDetail />;
```

- [ ] **Step 2: 对话侧板实现固定宽度、钉住、模式切换按钮**

```tsx
<div className="chat-panel__mode-toggle">
  <button>侧板</button>
  <button>弹窗</button>
</div>
```

- [ ] **Step 3: 对话内容用文档中的主动推送和指令示例**

```tsx
[
  "今日待办：2 条 L3 事件需要你处理",
  "你可以输入：创建一个紧急任务，处理客户投诉"
]
```

- [ ] **Step 4: 写交互测试**

```tsx
it("opens task detail in right panel", async () => {
  render(<App />);
  await user.click(screen.getByRole("button", { name: "任务" }));
  await user.click(screen.getByText("处理客户投诉"));
  expect(screen.getByText("任务详情")).toBeInTheDocument();
});
```

- [ ] **Step 5: 验证细节面板**

Run: `pnpm test -- src/app/app.test.tsx`

Expected: PASS

---

### Task 8: 文档同步和运行说明

**Files:**
- Modify: `docs/DESIGN.md`
- Create: `README.md`

- [ ] **Step 1: 在 docs/DESIGN.md 追加“当前实现范围”**

```md
## 当前实现范围（2026-07-23）

- Web SPA
- 本地 mock 数据
- 六大页面 + 工作空间切换 + 详情面板 + 对话侧板
- 未接真实插件/执行器/钉钉
```

- [ ] **Step 2: 写 README**

```md
# Nexus

## 启动

```bash
pnpm install
pnpm dev
```

## 测试

```bash
pnpm test
pnpm build
```
```

- [ ] **Step 3: 验证文档命令**

Run: `pnpm test && pnpm build`

Expected: 全部通过

---

## 自检

- `docs/DESIGN.md` 核心页面、工作空间、任务、执行器、规则、信息源、对话侧板，计划均已覆盖
- 第一阶段故意不做真实钉钉/规则执行/Agent 调度，边界已在“实现边界”写明
- 无 `TODO/TBD` 占位
- 类型名在任务间保持一致：`AttentionLevel`、`TaskStatus`、`Workspace`
