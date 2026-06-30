# mylife UI Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把当前前端从占位式演示页面，整改为符合需求的可用 H5 原型，并为后续 Mac 封装提供稳定 UI 基础。

**Architecture:** 先重做 Web 端 UI 信息架构，再把任务创建、拖拽、Markdown 编辑、真实页签与月历组件接入现有本地状态层。Mac 外壳后置，不先碰 Tauri 细节。

**Tech Stack:** React 19, TypeScript, Vite, CSS, `@dnd-kit`, Markdown 编辑/渲染组件

---

## 设计输入

本计划执行必须同时遵守以下设计资产，不允许只读文字计划直接发挥：

- [前端纠偏](../specs/2026-06-30-mylife-frontend-correction.md)
- [组件规范](../specs/2026-06-30-mylife-component-spec.md)
- [整改版桌面原型](../prototypes/2026-06-30-mylife-remediation-desktop.html)

## 目标拆分

本次整改拆成 4 个独立子系统，允许多 agent 并行：

1. 左侧导航与完整月历
2. 中间纵向状态泳道与拖拽
3. 右侧任务详情、真页签、Markdown 编辑体验
4. H5 预览校验与样式收敛

## 文件结构

### 需要新增

- `apps/desktop/src/features/calendar/month-panel.tsx`
  完整月历面板，展示整月日期、跨月补位、选中态
- `apps/desktop/src/features/tasks/task-lane-board.tsx`
  纵向状态泳道容器
- `apps/desktop/src/features/tasks/task-lane.tsx`
  单个状态泳道
- `apps/desktop/src/features/tasks/task-card.tsx`
  任务卡，承载标题、状态、提醒、子任务数、快捷操作
- `apps/desktop/src/features/tasks/task-inline-creator.tsx`
  自动保存式任务创建输入
- `apps/desktop/src/features/details/task-tabs.tsx`
  真页签组件
- `apps/desktop/src/features/details/task-markdown-editor.tsx`
  Markdown 编辑/预览组件
- `apps/desktop/src/features/details/task-checklist-tree.tsx`
  文档 checkbox 提取任务树
- `docs/superpowers/specs/2026-06-30-mylife-frontend-correction.md`
  设计纠偏说明

### 需要修改

- `apps/desktop/src/app/app-shell.tsx`
  重组整体布局与状态流
- `apps/desktop/src/features/calendar/month-filter.tsx`
  替换为完整月历实现，或被 `month-panel.tsx` 取代
- `apps/desktop/src/features/tasks/today-board.tsx`
  改为纵向拖拽看板，不再保留现有四栏大空白结构
- `apps/desktop/src/features/details/task-detail-pane.tsx`
  改为真正详情容器，不再直接输出原始字符串
- `apps/desktop/src/styles/app.css`
  全量重写布局、组件、状态、响应式规则
- `apps/desktop/package.json`
  增加拖拽与 Markdown 相关依赖
- `apps/desktop/src/lib/task-state.ts`
  增加内联创建自动保存、排序、拖拽移动辅助函数
- `apps/desktop/src/lib/types.ts`
  增加 UI 所需字段

### 需要测试

- `apps/desktop/src/features/calendar/month-panel.test.tsx`
- `apps/desktop/src/features/tasks/task-lane-board.test.tsx`
- `apps/desktop/src/features/details/task-markdown-editor.test.tsx`
- `apps/desktop/src/app/app-shell.test.tsx`

## Task 1: 锁定依赖与失败测试

**Files:**
- Modify: `apps/desktop/package.json`
- Modify: `apps/desktop/src/app/app-shell.test.tsx`
- Create: `apps/desktop/src/features/calendar/month-panel.test.tsx`
- Create: `apps/desktop/src/features/tasks/task-lane-board.test.tsx`
- Create: `apps/desktop/src/features/details/task-markdown-editor.test.tsx`

- [ ] 添加依赖：`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `react-markdown`
- [ ] 先写失败测试，覆盖：
  - 左侧展示完整月份日期
  - 中间状态区为纵向泳道
  - 任务拖拽换状态
  - 右侧有单组页签
  - Markdown 可编辑且可渲染
- [ ] 运行：`cd apps/desktop && pnpm test`
- [ ] 预期：新测试失败，暴露旧实现不符合需求

## Task 2: 重做左侧完整月历与工作空间栏

**Files:**
- Create: `apps/desktop/src/features/calendar/month-panel.tsx`
- Modify: `apps/desktop/src/app/app-shell.tsx`
- Modify: `apps/desktop/src/styles/app.css`
- Test: `apps/desktop/src/features/calendar/month-panel.test.tsx`

- [ ] 实现完整月历：
  - 展示当月全部日期
  - 周起始行
  - 跨月补位
  - 今天高亮
  - 选中日期高亮
- [ ] 保留工作空间列表在左侧下半区
- [ ] 左栏视觉向 Notion Calendar 靠近：紧凑、轻边框、连续层级
- [ ] 运行：`cd apps/desktop && pnpm test month-panel`

## Task 3: 中间区域改为纵向状态泳道

**Files:**
- Create: `apps/desktop/src/features/tasks/task-lane-board.tsx`
- Create: `apps/desktop/src/features/tasks/task-lane.tsx`
- Create: `apps/desktop/src/features/tasks/task-card.tsx`
- Create: `apps/desktop/src/features/tasks/task-inline-creator.tsx`
- Modify: `apps/desktop/src/features/tasks/today-board.tsx`
- Modify: `apps/desktop/src/app/app-shell.tsx`
- Modify: `apps/desktop/src/lib/task-state.ts`
- Modify: `apps/desktop/src/lib/types.ts`
- Modify: `apps/desktop/src/styles/app.css`
- Test: `apps/desktop/src/features/tasks/task-lane-board.test.tsx`

- [ ] 改成纵向泳道，而不是横向四大空列
- [ ] 每个泳道可折叠，显示计数
- [ ] 内联创建器支持：
  - 回车保存
  - 失焦保存
  - 空白丢弃
- [ ] 任务卡展示：
  - 标题
  - 状态
  - 提醒
  - 子任务数
  - 今天标记
- [ ] 保留快捷完成与下一状态
- [ ] 运行：`cd apps/desktop && pnpm test task-lane-board`

## Task 4: 接入真实拖拽

**Files:**
- Modify: `apps/desktop/src/features/tasks/task-lane-board.tsx`
- Modify: `apps/desktop/src/features/tasks/task-lane.tsx`
- Modify: `apps/desktop/src/features/tasks/task-card.tsx`
- Modify: `apps/desktop/src/lib/task-state.ts`
- Modify: `apps/desktop/src/styles/app.css`
- Test: `apps/desktop/src/features/tasks/task-lane-board.test.tsx`

- [ ] 使用 `@dnd-kit` 实现拖拽换状态
- [ ] 支持同泳道内排序
- [ ] 支持跨泳道移动
- [ ] 拖拽结束写入状态变化并触发 `5 秒撤销 toast`
- [ ] 添加拖拽反馈样式
- [ ] 运行：`cd apps/desktop && pnpm test task-lane-board`

## Task 5: 右侧改成真实页签与 Markdown 主编辑区

**Files:**
- Create: `apps/desktop/src/features/details/task-tabs.tsx`
- Create: `apps/desktop/src/features/details/task-markdown-editor.tsx`
- Create: `apps/desktop/src/features/details/task-checklist-tree.tsx`
- Modify: `apps/desktop/src/features/details/task-detail-pane.tsx`
- Modify: `apps/desktop/src/app/app-shell.tsx`
- Modify: `apps/desktop/src/styles/app.css`
- Test: `apps/desktop/src/features/details/task-markdown-editor.test.tsx`

- [ ] 删除重复按钮式假标签
- [ ] 建立单一页签栏：`任务详情` / `甘特图`
- [ ] 详情页以 Markdown 编辑区为主
- [ ] 文档支持编辑与渲染
- [ ] 文档 checkbox 提取任务树放在侧下区
- [ ] 提醒、状态、层级移到次级面板
- [ ] 运行：`cd apps/desktop && pnpm test task-markdown-editor`

## Task 6: 甘特图、提醒、详情信息重排

**Files:**
- Modify: `apps/desktop/src/features/details/gantt-tab.tsx`
- Modify: `apps/desktop/src/features/details/task-detail-pane.tsx`
- Modify: `apps/desktop/src/styles/app.css`
- Test: `apps/desktop/src/app/app-shell.test.tsx`

- [ ] 甘特图保留右侧第二页签
- [ ] 筛选控件并入统一页签内容头部
- [ ] 甘特图改为真实日期轴，不再使用脱离日期的抽象宽度段
- [ ] 首版至少展示按天刻度的日期列
- [ ] 提醒设置改成紧凑信息块，不与页签抢空间
- [ ] 运行：`cd apps/desktop && pnpm test`

## Task 7: H5 预览与视觉收敛

**Files:**
- Modify: `apps/desktop/src/styles/app.css`
- Modify: `apps/desktop/src/app/app-shell.tsx`
- Modify: `README.md`

- [ ] 启动 H5：`cd apps/desktop && pnpm dev`
- [ ] 浏览器自检：
  - 左侧完整月历是否可读
  - 中间是否仍有大片空白
  - 右侧 Markdown 是否占最大空间
  - 页签是否只有一组
  - 拖拽是否可用
- [ ] 通过后再回到桌面壳联调

## 执行顺序

并行建议：

- Agent A：Task 2 左侧月历
- Agent B：Task 3 + Task 4 中间拖拽区
- Agent C：Task 5 + Task 6 右侧详情与 Markdown
- 主线程：Task 1 建依赖与测试，Task 7 统合与验收

## 验收标准

- 左侧是完整月历，不是几天按钮
- 中间是纵向状态泳道，不是四块大空列
- 任务创建无需显式保存按钮
- 拖拽改状态可用
- 右侧页签只有一组
- Markdown 主区可编辑可预览
- 甘特图挂在真实日期轴上，而不是几段独立横杠
- 实现与整改版原型、组件规范一致，不允许再用临时占位按钮替代组件
- H5 先通过，再进入 Mac 封装
