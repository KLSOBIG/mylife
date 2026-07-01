# mylife

`mylife` 是 Mac 优先、纯本地优先的时间管理软件。核心目标：比 Notion 更轻，支持简单任务两步闭环，也支持复杂任务树、Markdown 文档、提醒、甘特图、小窗执行。

## 当前能力

- 今天优先三栏界面
- 工作空间与日历过滤
- 本地任务 API
- 状态切换与 5 秒撤销
- Markdown `[]` 解析
- 右侧单编辑器任务详情与甘特图页签
- 组件化 Markdown 工具条
- 主题切换
- 桌面小窗页面骨架
- GitHub macOS `.dmg` 打包工作流

## 目录结构

```text
apps/
  core/      Go 本地 API、SQLite、提醒与时间轴逻辑
  desktop/   React + Vite + Tauri 桌面端
docs/
  superpowers/specs/       设计文档、视觉与交互规则
  superpowers/plans/       实现计划
  superpowers/prototypes/  可审阅原型
```

## 本地开发

先安装：

- Node.js 22+
- pnpm 10.12.1+
- Go 1.26+
- Rust stable

安装依赖：

```bash
pnpm install
```

启动前端：

```bash
cd apps/desktop
pnpm dev
```

启动桌面端：

```bash
pnpm dev:desktop
```

## 测试

Go：

```bash
cd apps/core
go test ./...
```

前端单测：

```bash
cd apps/desktop
pnpm test
```

端到端：

```bash
cd apps/desktop
pnpm e2e
```

## 构建

前端构建：

```bash
cd apps/desktop
pnpm build
```

桌面安装包构建：

```bash
cd apps/desktop
pnpm tauri:build
```

## GitHub 产出 Mac 安装包

仓库已包含工作流：

`/.github/workflows/release-macos.yml`

触发方式：

1. 推送 tag，例如：

```bash
git tag v0.1.0
git push origin v0.1.0
```

2. 或在 GitHub Actions 页面手动触发 `release-macos`

产物：

- GitHub Actions Artifact：`mylife-macos-installer`
- 文件类型：`.dmg`

## 发版脚本

脚本位置：

`scripts/release-macos.sh`

用途：

- 同步远端 `main` 和 tags
- 校验 Go core / desktop 测试 / desktop 构建
- 推送 `main`
- 创建并推送新的版本 tag
- 触发 GitHub `release-macos` workflow 生成 `.dmg`

前置条件：

- 当前分支必须是 `main`
- 工作区必须干净
- 本机需要 `Node.js 18+` 且可用 `corepack`
- 版本号使用 `vX.Y.Z` 格式，且远端不存在同名 tag

用法：

```bash
./scripts/release-macos.sh v0.1.8
```

脚本内部会执行：

- `git fetch origin --tags`
- `git pull --ff-only origin main`
- `corepack pnpm install --frozen-lockfile`
- `cd apps/core && go test ./...`
- `cd apps/desktop && corepack pnpm test`
- `cd apps/desktop && corepack pnpm build`
- `git push origin main`
- `git tag vX.Y.Z`
- `git push origin vX.Y.Z`

完整示例：

```bash
git checkout main
git pull --ff-only origin main
./scripts/release-macos.sh v0.1.8
```

发布成功后查看：

- GitHub Actions：`https://github.com/KLSOBIG/mylife/actions`
- Releases：`https://github.com/KLSOBIG/mylife/releases`

常见失败：

- `错误: 需要在 main 分支运行`
- `错误: 工作区不干净，先提交或清理改动`
- `错误: 缺少 corepack，先安装 Node.js 18+ 或启用 corepack`
- `错误: 远端已存在标签 vX.Y.Z`

## 文档

- 设计文档：`docs/superpowers/specs/2026-06-30-mylife-design.md`
- 视觉系统：`docs/superpowers/specs/2026-06-30-mylife-visual-system.md`
- 交互规则：`docs/superpowers/specs/2026-06-30-mylife-interaction-states.md`
- 前端纠偏：`docs/superpowers/specs/2026-06-30-mylife-frontend-correction.md`
- 实现计划：`docs/superpowers/plans/2026-06-30-mylife-v1.md`
- UI 整改计划：`docs/superpowers/plans/2026-06-30-mylife-ui-remediation.md`
- 主窗口原型：`docs/superpowers/prototypes/2026-06-30-mylife-main-window.html`
- 小窗原型：`docs/superpowers/prototypes/2026-06-30-mylife-widget.html`
- 文档索引：`docs/superpowers/README.md`
