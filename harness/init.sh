#!/usr/bin/env bash
set -euo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$HARNESS_DIR/.." && pwd)"
cd "$ROOT_DIR"

INSTALL_CMD=(npm install)
TEST_CMD=(npm run test)
BUILD_CMD=(npm run build)
DIFF_CHECK_CMD=(git diff --check)
START_CMD=(npm run dev:all)

printf '==> 仓库根目录: %s
' "$PWD"
printf '==> Harness 目录: %s
' "$HARNESS_DIR"

echo '==> 同步依赖'
"${INSTALL_CMD[@]}"

echo '==> 运行标准测试'
"${TEST_CMD[@]}"

echo '==> 运行生产构建'
"${BUILD_CMD[@]}"

echo '==> 检查 diff 空白问题'
"${DIFF_CHECK_CMD[@]}"

echo '==> 标准启动命令'
printf '    %q' "${START_CMD[@]}"
printf '
'

if [ "${RUN_START_COMMAND:-0}" = "1" ]; then
  echo '==> 启动项目'
  exec "${START_CMD[@]}"
fi

echo '如果希望 init.sh 直接启动项目，请设置 RUN_START_COMMAND=1。'
