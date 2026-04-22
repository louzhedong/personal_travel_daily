#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.tools/run"

stop_from_pid_file() {
  local name="$1"
  local pid_file="$RUN_DIR/${name}.pid"

  if [[ ! -f "$pid_file" ]]; then
    printf '[skip] no pid file for %s\n' "$name"
    return 0
  fi

  local pid
  pid="$(cat "$pid_file")"

  if kill -0 "$pid" >/dev/null 2>&1; then
    kill "$pid"
    printf '[stop] %s pid=%s\n' "$name" "$pid"
  else
    printf '[skip] %s pid=%s is not running\n' "$name" "$pid"
  fi

  rm -f "$pid_file"
}

stop_from_pid_file "frontend"
stop_from_pid_file "app-api"
stop_from_pid_file "guide-api"

cat <<'EOF'
Local dev processes requested to stop.
MySQL is left running intentionally.
To stop Homebrew MySQL manually:
  brew services stop mysql
EOF
