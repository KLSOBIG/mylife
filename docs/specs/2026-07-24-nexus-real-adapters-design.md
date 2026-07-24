# Nexus Phase 3 真实插件与接入适配设计

## 目标

在不引入远程服务端和复杂鉴权前，先把三类“真实能力”做出最小闭环：

- 真实信息源
- 真实外部执行器
- 真实插件注册表

当前落地原则：

- 仍保持单用户本地模式
- 前端负责产品交互
- 本地适配层负责真实接线
- 业务状态仍由前端 domain store 持有

## 设计范围

### 做

- 本地插件注册表 `data/plugins.json`
- 本地 Node API `server/app.mjs`
- 真实 RSS 轮询同步
- 真实 CLI 执行器调用
- 前端统一网关 `src/domain/gateway.ts`
- 信息源页触发真实同步
- 任务详情触发真实执行

### 不做

- 远程服务端数据库
- 多用户权限
- 系统级调度器
- OpenCode / Claude / GPT 真 API
- 钉钉 / 邮件 / 飞书真接入

## 架构

```text
React UI
  -> gateway.ts
  -> 本地 Node API
     -> plugins.json
     -> RSS fetch
     -> CLI spawn
  -> 返回事件 / 执行结果
  -> domain store 写回任务与事件
```

## 关键决策

### 决策 1：先做本地适配 API，不直接把 fetch/spawn 塞前端

原因：

- 浏览器不能直接跑本地 CLI
- 后面接 Tauri / Go / 远程服务端时，前端网关接口可复用

### 决策 2：插件注册先走静态表，不先做安装器

原因：

- 先验证产品闭环
- 降低“插件市场/插件管理”复杂度

### 决策 3：真实接入优先选 RSS + CLI

原因：

- RSS 无鉴权，能最快验证“真实事件 -> 系统事件”
- CLI 能最快验证“真实执行器 -> 结果回写”

## 接口

### GET /api/plugins

返回当前可用信息源与执行器注册表。

### POST /api/sources/:id/sync

触发某个真实信息源同步，返回标准化事件数组。

### POST /api/executors/:id/run

触发某个真实执行器运行，入参为任务，返回：

- `summary`
- `log`
- `raw`

## 当前落地

### 已实现

- `source_3`: ArXiv RSS
- `exec_lobster`: CLI executor
- `exec_harness`: CLI executor

### 下一批

- 钉钉 Webhook
- 邮件拉取
- OpenCode CLI
- 执行超时 / 重试 / 并发限制
