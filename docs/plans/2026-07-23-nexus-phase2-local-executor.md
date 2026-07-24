# Nexus Phase 2 Local Executor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把静态执行器升级成可运行的本地执行器闭环，支持任务派发、运行日志、结果回写和真实运行统计。

**Architecture:** 保持前端单页应用架构，新增 `ExecutionRun` 领域模型与纯函数 reducer action；异步运行推进放在 React effect 层，不把 timer 逻辑写进 store。所有运行数据继续保存在 `localStorage`。

**Tech Stack:** React 19, TypeScript, Vite 6, Vitest, Testing Library, localStorage persistence

---

## 文件结构

- Modify: `src/domain/types.ts`
- Modify: `src/domain/mock-data.ts`
- Modify: `src/domain/store.ts`
- Modify: `src/domain/store.test.ts`
- Modify: `src/domain/persistence.ts`
- Modify: `src/domain/persistence.test.ts`
- Create: `src/domain/execution-runtime.ts`
- Create: `src/domain/execution-runtime.test.ts`
- Modify: `src/app/app.tsx`
- Modify: `src/app/app.test.tsx`
- Modify: `src/app/layout/detail-panel.tsx`
- Modify: `src/features/tasks/task-detail.tsx`
- Modify: `src/features/executors/executors-page.tsx`
- Modify: `src/features/dashboard/dashboard-page.tsx`
- Modify: `src/styles/app.css`
- Modify: `README.md`
- Modify: `docs/DESIGN.md`

### Task 1: 新增执行运行领域模型

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/mock-data.ts`
- Modify: `src/domain/store.ts`
- Modify: `src/domain/store.test.ts`

- [ ] **Step 1: 先写失败测试**

```ts
it("creates execution run and moves task into progress", () => {
  const model = createInitialModel();
  const next = reduceModel(model, {
    type: "task/executionStarted",
    taskId: "task_3",
    executorId: "exec_lobster",
    trigger: "manual"
  });

  expect(next.data.executionRuns).toHaveLength(1);
  expect(next.data.executionRuns[0]?.status).toBe("queued");
  expect(next.data.tasks.find((item) => item.id === "task_3")?.status).toBe("in_progress");
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test -- src/domain/store.test.ts -t "creates execution run"`

Expected: FAIL with unknown action or missing `executionRuns`

- [ ] **Step 3: 补领域类型和 seed**

新增：

- `ExecutionRunStatus`
- `ExecutionLogLevel`
- `ExecutionLog`
- `ExecutionRun`
- `AppData.executionRuns`

并在 `createSeedData()` 里给个人空间放 1 条已成功历史 run。

- [ ] **Step 4: 给 reducer 增 action**

新增 action：

- `task/executionStarted`
- `task/executionRunning`
- `task/executionSucceeded`
- `task/executionFailed`

要求：

- `started` 创建新 run，任务切 `in_progress`
- `running` 更新 run 状态并追加日志
- `succeeded` 任务切 `pending_review`
- `failed` 任务切 `returned`

- [ ] **Step 5: 跑 store 测试**

Run: `pnpm test -- src/domain/store.test.ts`

Expected: PASS

### Task 2: 运行时引擎与持久化

**Files:**
- Create: `src/domain/execution-runtime.ts`
- Create: `src/domain/execution-runtime.test.ts`
- Modify: `src/domain/persistence.ts`
- Modify: `src/domain/persistence.test.ts`

- [ ] **Step 1: 先写运行时纯函数测试**

```ts
it("finds queued runs that should be promoted", () => {
  const queued = collectQueuedRuns(model.data.executionRuns);
  expect(queued.map((item) => item.id)).toContain("run_queued_1");
});
```

- [ ] **Step 2: 写 persistence 回归测试**

```ts
it("persists execution runs", () => {
  const model = createInitialModel();
  expect(loadAppModel(storage).data.executionRuns).toBeDefined();
});
```

- [ ] **Step 3: 实现运行时纯函数**

职责：

- 找出 `queued` run
- 生成 `running` 日志 payload
- 生成默认成功/失败摘要文案

- [ ] **Step 4: 扩展 persistence 校验**

要求：

- `executionRuns` 缺失或结构不对时回退 seed
- 新结构不会打崩老缓存

- [ ] **Step 5: 跑测试**

Run: `pnpm test -- src/domain/execution-runtime.test.ts src/domain/persistence.test.ts`

Expected: PASS

### Task 3: App 接本地执行引擎

**Files:**
- Modify: `src/app/app.tsx`
- Modify: `src/app/app.test.tsx`

- [ ] **Step 1: 先写 app 行为测试**

```tsx
it("starts execution from task detail", async () => {
  render(<App />);
  await user.click(screen.getByRole("button", { name: "任务" }));
  await user.click(screen.getByRole("button", { name: /追踪 AI 融资资讯/ }));
  await user.click(screen.getByRole("button", { name: "开始执行" }));
  expect(screen.getByText("queued")).toBeInTheDocument();
});
```

- [ ] **Step 2: 补 app 内 dispatch 接线**

要求：

- 任务详情按钮能触发 `task/executionStarted`
- `useEffect` 监听 queued runs
- queued 自动推进到 running

- [ ] **Step 3: 补成功/失败动作**

要求：

- 当前 run 为 `running` 时显示 `标记成功 / 标记失败`
- 成功后任务进入 `pending_review`
- 失败后任务进入 `returned`

- [ ] **Step 4: 跑 app 测试**

Run: `pnpm test -- src/app/app.test.tsx`

Expected: PASS

### Task 4: 任务详情补执行面板

**Files:**
- Modify: `src/app/layout/detail-panel.tsx`
- Modify: `src/features/tasks/task-detail.tsx`
- Modify: `src/styles/app.css`

- [ ] **Step 1: 补 props 设计**

`TaskDetail` 增：

- `runs?: ExecutionRun[]`
- `activeRun?: ExecutionRun`
- `onStartExecution?`
- `onMarkExecutionSuccess?`
- `onMarkExecutionFailure?`
- `onRetryExecution?`

- [ ] **Step 2: 实现运行面板**

展示：

- 当前 run 状态
- 摘要
- 错误
- 日志时间线
- 对应操作按钮

- [ ] **Step 3: 跑测试**

Run: `pnpm test -- src/app/app.test.tsx -t "execution"`

Expected: PASS

### Task 5: 执行器页与仪表盘真实统计

**Files:**
- Modify: `src/features/executors/executors-page.tsx`
- Modify: `src/features/dashboard/dashboard-page.tsx`
- Modify: `src/app/app.tsx`
- Modify: `src/app/app.test.tsx`

- [ ] **Step 1: 先写失败测试**

```tsx
it("updates executor board after execution succeeds", async () => {
  render(<App />);
  // 开始执行并标记成功后，执行器卡片应显示完成数增加
});
```

- [ ] **Step 2: 从 run 派生统计**

执行器卡显示：

- `队列中`
- `执行中`
- `今日完成`
- `失败次数`
- `最近结果`

仪表盘显示：

- `Agent 处理中`
- `AI 已完成`
- `执行失败`

- [ ] **Step 3: 跑测试**

Run: `pnpm test -- src/app/app.test.tsx`

Expected: PASS

### Task 6: 文档和全量验证

**Files:**
- Modify: `README.md`
- Modify: `docs/DESIGN.md`

- [ ] **Step 1: README 更新二期能力**

写清：

- 本地执行器
- 运行日志
- 结果回写
- 执行统计

- [ ] **Step 2: DESIGN 更新二期已实现范围**

明确：

- 本地执行器闭环已完成
- 外部 OpenCode/CLI/API 仍未接入

- [ ] **Step 3: 全量验证**

Run: `pnpm test && pnpm build`

Expected: PASS
