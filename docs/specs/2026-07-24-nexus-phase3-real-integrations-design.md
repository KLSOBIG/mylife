# Nexus Phase 3 Real Integrations Design

> 更新：2026-07-24

## 目标

把本地适配 API 升级成可维护 server runtime，补齐三类真实能力最小闭环：

- 插件注册表拆模块
- 真实规则运行时
- 钉钉 / 邮件 / OpenCode 最小接入

## 范围

本期做：

- `server/app.mjs` 拆成路由装配层
- `server/lib/registry.mjs` 统一读取 `data/plugins.json` 与 `data/rules.json`
- `GET /api/plugins` 返回 `sources/executors/rules`
- `POST /api/rules/evaluate` 返回命中规则、标准动作、决策摘要
- `POST /api/webhooks/dingtalk/:sourceId` 接收钉钉 webhook 并转标准事件
- `POST /api/sources/:id/sync` 支持 RSS 与本地 JSON 邮件轮询
- `POST /api/executors/:id/run` 支持 CLI 与 OpenCode executor
- `GET /healthz` 返回插件健康明细，OpenCode 缺失只记 `warning`

本期不做：

- 前端状态回放改造
- 钉钉签名校验、加解密、challenge 握手
- IMAP / Gmail / Exchange 正式邮件接入
- 远程服务端存储、多租户、鉴权
- 新 npm 依赖

## 模块边界

### `server/lib/http.mjs`

- CORS
- JSON 读写
- 路由异常兜底

### `server/lib/registry.mjs`

- 读取 `data/plugins.json`
- 读取 `data/rules.json`
- 输出统一注册表 `{sources, executors, rules}`
- 提供按 id 查询

### `server/lib/sources/*`

- `rss-source.mjs`: 把 RSS XML 转标准事件
- `email-source.mjs`: 从本地 JSON inbox 文件轮询邮件
- `dingtalk-source.mjs`: 把 webhook payload 转标准事件

标准事件字段：

- `id`
- `workspaceId`
- `title`
- `source`
- `sender`
- `level`
- `summary`
- `happenedAt`
- `tags`

### `server/lib/executors/*`

- `cli-executor.mjs`: 通用本地命令执行
- `opencode-executor.mjs`: OpenCode CLI 缺省参数包装

执行结果字段：

- `summary`
- `log`
- `raw`

### `server/lib/rules/*`

- `matchers.mjs`: `all/any` 条件组合与 `includes/equals` 基础匹配
- `actions.mjs`: 规则动作模板展开
- `runtime.mjs`: 规则过滤、优先级排序、命中求值、摘要生成

标准动作：

- `set_level`
- `create_task`
- `assign_executor`
- `archive_event`
- `append_note`

### `server/lib/health.mjs`

- source 检查：启用状态、邮件 inbox 文件是否可读
- executor 检查：命令是否存在
- rule 检查：启停状态
- 汇总：`ok/error` 总状态 + 明细

## 数据文件

### `data/plugins.json`

保留插件实例配置：

- sources:
  - RSS
  - Local Email Inbox
  - DingTalk Webhook
- executors:
  - Lobster CLI
  - Harness CLI
  - OpenCode CLI

### `data/rules.json`

保留规则实例：

- `rule_arxiv_agent_digest`
- `rule_dingtalk_alert`

## 接口

### `GET /api/plugins`

返回：

```json
{
  "sources": [],
  "executors": [],
  "rules": []
}
```

### `POST /api/rules/evaluate`

入参：

```json
{
  "workspaceId": "ws_team",
  "event": {
    "title": "紧急 告警",
    "source": "DingTalk Webhook",
    "sender": "ops-bot",
    "tags": ["告警"]
  }
}
```

出参：

```json
{
  "workspaceId": "ws_team",
  "matchedRules": [],
  "actions": [],
  "summary": "matched 1 rule(s): rule_dingtalk_alert"
}
```

### `POST /api/webhooks/dingtalk/:sourceId`

接收钉钉 webhook JSON，当前最小实现：

- 读取文本消息正文
- 读取发送人
- 自动补 `告警` / `@mention` 等标签
- 返回标准事件数组

### `POST /api/sources/:id/sync`

- RSS source: 拉 RSS
- Email source: 读本地 JSON inbox 文件

邮件 inbox JSON 结构：

```json
{
  "messages": [
    {
      "id": "mail_1",
      "subject": "客户投诉",
      "from": "customer@example.com",
      "text": "订单延迟",
      "summary": "用户反馈订单延迟",
      "receivedAt": "2026-07-24 10:30",
      "tags": ["客户", "投诉"]
    }
  ]
}
```

### `GET /healthz`

返回插件健康明细。规则：

- 缺 inbox 文件：`warning`
- disabled plugin：`warning`
- 缺普通 CLI 命令：`error`
- 缺 OpenCode 命令：`warning`

## 失败策略

- JSON 解析异常：返回 `500`
- source / executor 不存在：返回 `404`
- 执行器超时：返回 `500`，消息带 timeout
- OpenCode 未安装：health 标记 warning；真正调用时返回执行错误

## 验证

- `node --test server/test/*.test.mjs`
- smoke:
  - `GET /healthz`
  - `GET /api/plugins`
  - `POST /api/rules/evaluate`
  - `POST /api/sources/source_email_local/sync`
  - `POST /api/webhooks/dingtalk/source_dingtalk_webhook`
