#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "用法: $0 vX.Y.Z" >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

TAG="$1"
PNPM_CMD=()

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "错误: 不是 git 仓库" >&2
  exit 1
fi

if [[ ! "${TAG}" =~ ^v[0-9]+(\.[0-9]+){2}$ ]]; then
  echo "错误: tag 必须是 vX.Y.Z 格式" >&2
  exit 1
fi

if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "错误: 需要在 main 分支运行" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "错误: 工作区不干净，先提交或清理改动" >&2
  exit 1
fi

if command -v corepack >/dev/null 2>&1; then
  PNPM_CMD=(corepack pnpm)
elif command -v pnpm >/dev/null 2>&1; then
  PNPM_CMD=(pnpm)
else
  echo "错误: 缺少 pnpm/corepack，先安装 Node.js 18+ 并启用 pnpm" >&2
  exit 1
fi

echo "同步 main 和 tags"
git fetch origin --tags
git pull --ff-only origin main

if [[ -n "$(git status --porcelain)" ]]; then
  echo "错误: 同步后工作区不干净，停止发版" >&2
  exit 1
fi

echo "安装依赖"
"${PNPM_CMD[@]}" install --frozen-lockfile

echo "测试 Go core"
(cd apps/core && go test ./...)

echo "测试 desktop"
(cd apps/desktop && "${PNPM_CMD[@]}" test)

echo "构建 desktop"
(cd apps/desktop && "${PNPM_CMD[@]}" build)

echo "推送 main"
git push origin main

REMOTE_TAG_EXISTS=0
if git ls-remote --exit-code --tags origin "refs/tags/${TAG}" >/dev/null 2>&1; then
  REMOTE_TAG_EXISTS=1
fi

if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  echo "标签 ${TAG} 已存在，跳过创建"
elif [[ "${REMOTE_TAG_EXISTS}" -eq 1 ]]; then
  echo "错误: 远端已存在标签 ${TAG}，先确认版本号或执行 git fetch --tags" >&2
  exit 1
else
  echo "创建标签 ${TAG}"
  git tag "${TAG}"
fi

if [[ "${REMOTE_TAG_EXISTS}" -eq 1 ]]; then
  echo "远端标签 ${TAG} 已存在，跳过推送"
else
  echo "推送标签 ${TAG}"
  git push origin "${TAG}"
fi

echo "完成"
echo "下一步: 去 GitHub Actions 看 release-macos workflow，下载 dmg 产物"
