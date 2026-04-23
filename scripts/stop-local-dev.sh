#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.tools/run"

cd "$ROOT_DIR"

find_docker_bin() {
  if command -v docker >/dev/null 2>&1; then
    command -v docker
    return 0
  fi

  if [[ -x "/Applications/Docker.app/Contents/Resources/bin/docker" ]]; then
    echo "/Applications/Docker.app/Contents/Resources/bin/docker"
    return 0
  fi

  return 1
}

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

DOCKER_BIN="$(find_docker_bin || true)"
if [[ -n "$DOCKER_BIN" ]]; then
  "$DOCKER_BIN" compose stop mysql adminer >/dev/null || true
  printf '[stop] docker compose services mysql/adminer\n'
else
  printf '[warn] Docker CLI not found, skip stopping mysql/adminer containers\n'
fi
