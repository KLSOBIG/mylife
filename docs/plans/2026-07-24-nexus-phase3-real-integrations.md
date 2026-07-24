# Nexus Phase 3 Real Integrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把当前“最小真实接入”扩成可持续使用的第二批真实能力：真实规则插件、更多真实外部执行器、更多真实信息源。

**Architecture:** 保持现有 `React Web SPA + localStorage + 本地 Node API` 架构。前端继续只消费统一 gateway；`server/` 负责真实接线、健康检查、适配器执行；插件注册表继续本地化，但拆成可扩展模块。规则插件不直接写死在前端 reducer，而是通过适配层返回标准动作，前端只负责回放动作和展示结果。

**Tech Stack:** React 19, TypeScript, Vite 6, Node HTTP server, localStorage persistence, CLI spawn, Webhook endpoints, polling adapters

---

## 实现边界

- 本期聚焦：
  - 真实规则插件运行时
  - `OpenCode CLI` 执行器接入
  - 至少 1 个远程 API 执行器接入骨架
  - 钉钉 Webhook 信息源
  - 邮件轮询信息源
  - 插件健康状态与基础配置展示
- 本期不做：
  - 云同步
  - 多用户权限
  - 完整插件安装市场
  - 复杂任务调度器
  - 系统级通知

## 文件结构

- Create: `docs/specs/2026-07-24-nexus-phase3-real-integrations-design.md`
- Create: `server/lib/registry.mjs`
- Create: `server/lib/http.mjs`
- Create: `server/lib/sources/rss-source.mjs`
- Create: `server/lib/sources/dingtalk-source.mjs`
- Create: `server/lib/sources/email-source.mjs`
- Create: `server/lib/executors/cli-executor.mjs`
- Create: `server/lib/executors/opencode-executor.mjs`
- Create: `server/lib/executors/api-executor.mjs`
- Create: `server/lib/rules/runtime.mjs`
- Create: `server/lib/rules/matchers.mjs`
- Create: `server/lib/rules/actions.mjs`
- Create: `server/lib/health.mjs`
- Modify: `server/app.mjs`
- Modify: `data/plugins.json`
- Create: `data/rules.json`
- Create: `src/domain/plugin-types.ts`
- Modify: `src/domain/gateway.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/store.ts`
- Modify: `src/domain/persistence.ts`
- Modify: `src/app/app.tsx`
- Modify: `src/app/app.test.tsx`
- Modify: `src/features/sources/sources-page.tsx`
- Modify: `src/features/tasks/task-detail.tsx`
- Modify: `src/features/executors/executors-page.tsx`
- Create: `src/features/plugins/plugins-page.tsx`
- Modify: `src/app/layout/sidebar.tsx`
- Modify: `src/styles/app.css`
- Modify: `README.md`
- Modify: `docs/DESIGN.md`
- Modify: `docs/modules/04-plugin.md`
- Modify: `docs/modules/06-dingtalk.md`

---

### Task 1: 先补真实接入设计文档

**Files:**
- Create: `docs/specs/2026-07-24-nexus-phase3-real-integrations-design.md`
- Modify: `docs/DESIGN.md`
- Modify: `docs/modules/04-plugin.md`
- Modify: `docs/modules/06-dingtalk.md`

- [ ] **Step 1: 写 Phase 3 设计文档**

文档必须覆盖：

- 真实规则插件运行时边界
- `OpenCode CLI` / 通用 CLI / 通用 API 执行器模型
- 钉钉 Webhook 接入流程
- 邮件轮询接入流程
- 健康检查与错误回传

- [ ] **Step 2: 更新总设计文档当前范围**

把 `docs/DESIGN.md` 中 “Phase 2.5 / Phase 3” 拆清：

- `Phase 3A`: 真实规则插件 + OpenCode CLI
- `Phase 3B`: 钉钉 + 邮件信息源

- [ ] **Step 3: 更新模块文档现状**

在插件系统和钉钉文档里加：

- 当前已实现
- 当前未实现
- 本期实施顺序

- [ ] **Step 4: 自查文档引用**

Run: `rg -n 'docs/superpowers|DESIGN.md|Phase 2.5|Phase 3' docs README.md -S`

Expected: 只剩正确的新路径和新阶段描述

- [ ] **Step 5: Commit**

```bash
git add docs/DESIGN.md docs/modules/04-plugin.md docs/modules/06-dingtalk.md docs/specs/2026-07-24-nexus-phase3-real-integrations-design.md
git commit -m "docs: define phase3 real integration design"
```

---

### Task 2: 把 server 适配层拆成可维护模块

**Files:**
- Create: `server/lib/registry.mjs`
- Create: `server/lib/http.mjs`
- Create: `server/lib/health.mjs`
- Modify: `server/app.mjs`
- Modify: `data/plugins.json`

- [ ] **Step 1: 先写失败测试或 smoke 用例说明**

先定义要保住的接口：

- `GET /healthz`
- `GET /api/plugins`
- `POST /api/sources/:id/sync`
- `POST /api/executors/:id/run`
- `POST /api/rules/evaluate`

- [ ] **Step 2: 把 registry 从 app.mjs 拆出去**

`server/lib/registry.mjs` 负责：

- 读取 `data/plugins.json`
- 校验 source/executor/rule 插件结构
- 提供 `getSourceById/getExecutorById/getRulePlugins`

- [ ] **Step 3: 把 http 共通层拆出去**

`server/lib/http.mjs` 负责：

- `readJson(req)`
- `sendJson(res, status, body)`
- `applyCors(res)`
- 路由错误统一格式

- [ ] **Step 4: 把 health 检查拆出去**

`server/lib/health.mjs` 负责：

- 检查插件是否启用
- CLI 命令是否存在
- 必填配置是否齐
- 返回 `ok / warning / error`

- [ ] **Step 5: 跑 smoke**

Run:

```bash
pnpm dev:api
curl -sS http://127.0.0.1:4318/healthz
curl -sS http://127.0.0.1:4318/api/plugins
```

Expected:

- health 返回插件健康明细
- plugins 返回 source/executor/rule 三类注册信息

- [ ] **Step 6: Commit**

```bash
git add server/app.mjs server/lib data/plugins.json
git commit -m "refactor(server): split adapter runtime modules"
```

---

### Task 3: 增真实规则插件运行时

**Files:**
- Create: `server/lib/rules/runtime.mjs`
- Create: `server/lib/rules/matchers.mjs`
- Create: `server/lib/rules/actions.mjs`
- Create: `data/rules.json`
- Modify: `server/app.mjs`
- Modify: `src/domain/gateway.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/store.ts`
- Modify: `src/app/app.tsx`

- [ ] **Step 1: 定规则插件数据结构**

`data/rules.json` 最少包含：

- `id`
- `workspaceId`
- `pluginId`
- `enabled`
- `when`
- `then`
- `priority`

- [ ] **Step 2: 实现 matcher**

至少支持：

- 来源匹配
- 标题关键词匹配
- 发送人匹配
- 标签匹配
- 工作空间匹配

- [ ] **Step 3: 实现动作生成**

标准动作：

- `set_level`
- `create_task`
- `assign_executor`
- `archive_event`
- `append_note`

- [ ] **Step 4: 增 API**

`POST /api/rules/evaluate`

输入：

- 单条事件
- 当前工作空间

输出：

- 命中规则
- 标准动作列表
- 决策摘要

- [ ] **Step 5: 前端接线**

事件创建或真实同步后：

- 调 `evaluate`
- 回放动作到 store
- 在 chat/log 中写“规则命中摘要”

- [ ] **Step 6: 验证**

至少覆盖：

- RSS 同步事件命中 `论文 -> L1` 规则
- 钉钉告警消息命中 `紧急 -> L3 + 建任务`
- 未命中规则时不改事件

- [ ] **Step 7: Commit**

```bash
git add data/rules.json server/lib/rules server/app.mjs src/domain/gateway.ts src/domain/types.ts src/domain/store.ts src/app/app.tsx
git commit -m "feat(rules): add real rule plugin runtime"
```

---

### Task 4: 增 OpenCode CLI 与通用执行器

**Files:**
- Create: `server/lib/executors/cli-executor.mjs`
- Create: `server/lib/executors/opencode-executor.mjs`
- Create: `server/lib/executors/api-executor.mjs`
- Modify: `server/app.mjs`
- Modify: `data/plugins.json`
- Modify: `src/domain/gateway.ts`
- Modify: `src/features/tasks/task-detail.tsx`
- Modify: `src/features/executors/executors-page.tsx`

- [ ] **Step 1: 抽通用 CLI 执行器**

通用 CLI 参数：

- `command`
- `args`
- `env`
- `timeoutMs`
- `parser`

- [ ] **Step 2: 落 OpenCode CLI 适配器**

要求：

- 从插件配置组装命令
- 传任务 JSON
- 捕获 stdout/stderr
- 超时杀进程
- 返回统一结果结构

- [ ] **Step 3: 落通用 API 执行器骨架**

不一定首批接真模型，但先把接口留好：

- `endpoint`
- `headers`
- `payloadTemplate`
- `responseMapper`

- [ ] **Step 4: 前端展示健康和适配类型**

执行器页新增：

- 适配类型 `cli/api/sdk`
- 健康状态
- 最近一次真实执行摘要

- [ ] **Step 5: 验证**

至少跑：

```bash
curl -sS -X POST http://127.0.0.1:4318/api/executors/<opencode-id>/run -H 'content-type: application/json' --data '{"task":{"id":"task_opencode","title":"验证 OpenCode"}}'
```

Expected:

- 成功时返回 `summary/log/raw`
- 失败时返回结构化错误

- [ ] **Step 6: Commit**

```bash
git add server/lib/executors server/app.mjs data/plugins.json src/domain/gateway.ts src/features/tasks/task-detail.tsx src/features/executors/executors-page.tsx
git commit -m "feat(executor): add opencode and generic adapters"
```

---

### Task 5: 增钉钉 Webhook 信息源

**Files:**
- Create: `server/lib/sources/dingtalk-source.mjs`
- Modify: `server/app.mjs`
- Modify: `data/plugins.json`
- Modify: `src/domain/gateway.ts`
- Modify: `src/app/app.tsx`
- Modify: `src/features/sources/sources-page.tsx`

- [ ] **Step 1: 在插件注册表加钉钉 source**

配置至少留：

- `appKey`
- `appSecret`
- `token`
- `aesKey`
- `corpId`
- `agentId`

- [ ] **Step 2: 增 webhook 路由**

新增：

- `POST /api/sources/dingtalk/webhook`

功能：

- 接收原始消息
- 做最小签名/配置校验
- 转标准事件

- [ ] **Step 3: 做钉钉消息标准化**

标准化字段：

- `title`
- `summary`
- `sender`
- `source`
- `tags`
- `raw`

- [ ] **Step 4: 前端接线**

来源页能看到：

- 钉钉 source 状态
- 最近 webhook 收到时间
- 最后错误信息

- [ ] **Step 5: 验证**

用本地 mock webhook body 打：

```bash
curl -sS -X POST http://127.0.0.1:4318/api/sources/dingtalk/webhook -H 'content-type: application/json' --data '@fixtures/dingtalk-message.json'
```

Expected:

- 返回标准化事件
- 前端刷新后能看到新事件进入对应工作空间

- [ ] **Step 6: Commit**

```bash
git add server/lib/sources/dingtalk-source.mjs server/app.mjs data/plugins.json src/domain/gateway.ts src/app/app.tsx src/features/sources/sources-page.tsx
git commit -m "feat(source): add dingtalk webhook adapter"
```

---

### Task 6: 增邮件轮询信息源

**Files:**
- Create: `server/lib/sources/email-source.mjs`
- Modify: `server/app.mjs`
- Modify: `data/plugins.json`
- Modify: `src/domain/gateway.ts`
- Modify: `src/app/app.tsx`

- [ ] **Step 1: 先定本地模式**

本期只做一种：

- `imap` 轮询

配置：

- `host`
- `port`
- `username`
- `password`
- `folder`
- `pollInterval`

- [ ] **Step 2: 抽邮件转事件映射**

字段映射：

- 发件人 -> `sender`
- 主题 -> `title`
- 正文摘要 -> `summary`
- 邮件标签 -> `tags`

- [ ] **Step 3: 增同步接口**

继续复用：

- `POST /api/sources/:id/sync`

当 source kind 为 `email` 时走邮件适配器

- [ ] **Step 4: 验证**

至少做：

- 无配置时报错清晰
- 同步成功返回标准事件数组
- 重复邮件不会无限重复生成

- [ ] **Step 5: Commit**

```bash
git add server/lib/sources/email-source.mjs server/app.mjs data/plugins.json src/domain/gateway.ts src/app/app.tsx
git commit -m "feat(source): add email polling adapter"
```

---

### Task 7: 增插件管理页与健康状态

**Files:**
- Create: `src/features/plugins/plugins-page.tsx`
- Modify: `src/app/layout/sidebar.tsx`
- Modify: `src/app/app.tsx`
- Modify: `src/domain/gateway.ts`
- Modify: `src/styles/app.css`

- [ ] **Step 1: 新增插件页入口**

页面至少分三段：

- 信息源
- 执行器
- 规则插件

- [ ] **Step 2: 展示插件健康状态**

每条插件展示：

- 名称
- 类型
- workspace
- enabled
- health
- lastError

- [ ] **Step 3: 支持最小动作**

首批只做：

- 刷新注册表
- 手动健康检查
- 跳转到来源/执行器页面

- [ ] **Step 4: 验证**

Run: `pnpm test`

Expected:

- 插件页能渲染三类插件
- health 返回 warning/error 时 UI 有区别样式

- [ ] **Step 5: Commit**

```bash
git add src/features/plugins/plugins-page.tsx src/app/layout/sidebar.tsx src/app/app.tsx src/domain/gateway.ts src/styles/app.css
git commit -m "feat(ui): add plugin health page"
```

---

### Task 8: 全量验证与收口

**Files:**
- Modify: `README.md`
- Modify: `docs/README.md`

- [ ] **Step 1: 更新启动说明**

README 必须写清：

- `pnpm dev`
- `pnpm dev:api`
- 哪些真实接入需要本地配置
- 哪些仅有 mock / skeleton

- [ ] **Step 2: 跑全量验证**

Run:

```bash
pnpm test
pnpm build
pnpm dev:api
curl -sS http://127.0.0.1:4318/healthz
curl -sS http://127.0.0.1:4318/api/plugins
```

Expected:

- 前端测试全绿
- 构建通过
- API 返回真实插件状态

- [ ] **Step 3: 手工验收清单**

- RSS 同步可用
- 钉钉 webhook 可收事件
- 邮件同步可返回事件
- OpenCode CLI 可执行
- 规则插件会命中并产生动作
- 插件页可看健康状态

- [ ] **Step 4: Commit**

```bash
git add README.md docs/README.md
git commit -m "docs: finalize phase3 real integration guide"
```
