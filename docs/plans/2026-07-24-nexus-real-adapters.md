# Nexus Real Adapters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有单用户 Web 架构内接入首个真实插件注册表、首个真实信息源、首个真实外部执行器。

**Architecture:** 增加本地 Node API 作为真实接线适配层，前端通过统一 gateway 调用；信息源走 RSS 轮询，执行器走 CLI spawn，结果仍回写前端 domain store。

**Tech Stack:** React 19, TypeScript, Vite 6, Node HTTP server, localStorage persistence

---

## 实现范围

- 真实插件注册表
- 真实 RSS 同步
- 真实 CLI 执行
- 前端接线
- 文档与启动说明

## 文件结构

- Create: `data/plugins.json`
- Create: `server/app.mjs`
- Create: `src/domain/gateway.ts`
- Modify: `src/app/app.tsx`
- Modify: `src/features/sources/sources-page.tsx`
- Modify: `src/features/tasks/task-detail.tsx`
- Modify: `src/app/layout/detail-panel.tsx`
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `README.md`
- Modify: `docs/DESIGN.md`
- Modify: `docs/modules/04-plugin.md`

## 已执行结果

- [x] 插件注册表已落 `data/plugins.json`
- [x] 本地 API 已落 `server/app.mjs`
- [x] 前端网关已落 `src/domain/gateway.ts`
- [x] 信息源页已能触发真实同步
- [x] 任务详情已能触发真实执行
- [x] README / DESIGN / 插件模块文档已同步
