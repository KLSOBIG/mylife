# Nexus Phase 2 本地执行器闭环设计

## 目标

二期把一期里的“静态执行器”升级成“可运行执行器”。

本期不接真实外部服务，不引入后端。先在当前 `Web SPA + localStorage` 架构内做出首个本地真实执行器闭环：

- 任务可派发给执行器
- 执行器可真实进入运行中
- 运行过程会产生日志
- 运行成功/失败会回写任务状态
- 仪表盘、执行器页、任务详情展示真实运行数据

## 范围

### 做

- 新增执行运行实体 `ExecutionRun`
- 给任务详情增加 `开始执行 / 重试 / 标记成功 / 标记失败`
- 执行器页展示当前运行、最近结果、队列统计
- 仪表盘展示真实 `执行中 / 今日完成 / 失败`
- 所有运行数据持久化到 `localStorage`
- 提供本地执行引擎，自动把 `queued` 运行推进到 `running`

### 不做

- 不接 OpenCode / Claude / GPT / 本地 CLI 真进程
- 不做多执行器并发调度策略
- 不做服务端同步
- 不做系统通知

## 设计决策

### 决策 1：先做本地执行器，不做外部真实接入

原因：

- 当前项目还是纯前端单用户
- 直接接 CLI / API 会把二期变成“前后端 + 鉴权 + 环境依赖”工程
- 先把运行时模型、日志、状态回写做对，三期再替换适配层

### 决策 2：运行状态独立于任务状态

新增 `ExecutionRun`，不把执行细节塞进 `TaskItem`。

`TaskItem` 只保留业务状态：

- `pending_assignment`
- `assigned`
- `in_progress`
- `pending_review`
- `completed`
- `suspended`
- `escalated`
- `returned`

`ExecutionRun` 管运行态：

- `queued`
- `running`
- `succeeded`
- `failed`
- `cancelled`

这样后面一个任务多次重试、多人接力、保留审计历史都不需要重构任务模型。

### 决策 3：本地执行引擎用 effect 驱动，不把异步塞进 reducer

Reducer 仍然只做纯状态更新。

运行时引擎放在 React 层：

- 看到 `queued` run
- 调度短延迟推进到 `running`
- 根据运行结果派发 `succeeded/failed`

这样测试简单，store 纯净，未来换成后端轮询/WebSocket 也容易。

## 数据模型

### `ExecutionRun`

- `id`
- `workspaceId`
- `taskId`
- `executorId`
- `status`
- `startedAt?`
- `finishedAt?`
- `summary?`
- `error?`
- `trigger`: `manual | auto`
- `logs`: `ExecutionLog[]`

### `ExecutionLog`

- `id`
- `at`
- `level`: `info | success | error`
- `message`

### `AppData`

新增：

- `executionRuns: ExecutionRun[]`

## 运行规则

### 开始执行

前提：

- 任务已分配执行器
- 任务状态是 `assigned / returned / suspended`
- 执行器不是 `offline / error`

动作：

- 创建 `queued` run
- 任务状态切到 `in_progress`
- 写首条日志

### 引擎推进

本地引擎看到 `queued`：

- 短延迟推进成 `running`
- 追加“已领取任务”日志

### 完成执行

用户在任务详情里点 `标记成功`：

- run -> `succeeded`
- 任务 -> `pending_review`
- 写成功摘要

### 执行失败

用户在任务详情里点 `标记失败`：

- run -> `failed`
- 任务 -> `returned`
- 记录错误信息

### 重试

失败 run 不复用。

点 `重试执行`：

- 基于同任务新建 run
- 旧 run 保留

## UI 变更

### 任务详情

新增区块 `执行运行`：

- 当前执行器
- 运行状态 badge
- `开始执行`
- `标记成功`
- `标记失败`
- `重试执行`
- 日志时间线

### 执行器页

每张卡新增：

- `队列中`
- `运行中`
- `今日完成`
- `失败次数`
- 最近一次运行摘要

### 仪表盘

统计改真实值：

- `Agent 处理中`
- `AI 已完成`
- `执行失败`

## 测试

### Domain

- 创建 run
- run 状态流转
- 完成/失败回写任务
- persistence 对新增 `executionRuns` 仍可读写

### App

- 任务详情可开始执行
- run 进入运行中
- 成功后任务变 `pending_review`
- 失败后任务变 `returned`
- 执行器页统计随 run 变化

## 验收

满足以下即算二期完成：

- 从任务详情给任务分配执行器并开始执行
- 右侧能看到运行日志
- 成功/失败能改变任务状态
- 执行器页和仪表盘数据同步变化
- 刷新页面后运行记录仍在
