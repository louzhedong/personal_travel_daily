#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.tools/dev-logs"
RUN_DIR="$ROOT_DIR/.tools/run"

mkdir -p "$LOG_DIR" "$RUN_DIR"

cd "$ROOT_DIR"

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

is_port_listening() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

wait_for_url() {
  local url="$1"
  local name="$2"

  for _ in $(seq 1 30); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      printf '[ok] %s is ready: %s\n' "$name" "$url"
      return 0
    fi
    sleep 1
  done

  printf '[warn] %s did not become ready in time: %s\n' "$name" "$url"
  return 1
}

start_process() {
  local name="$1"
  local port="$2"
  local pid_file="$RUN_DIR/${name}.pid"
  local log_file="$LOG_DIR/${name}.log"
  shift 2

  if is_port_listening "$port"; then
    printf '[skip] %s already listening on %s\n' "$name" "$port"
    return 0
  fi

  printf '[start] %s\n' "$name"
  nohup "$@" >"$log_file" 2>&1 &
  local pid=$!
  echo "$pid" >"$pid_file"
  printf '[info] %s pid=%s log=%s\n' "$name" "$pid" "$log_file"
}

ensure_env_file() {
  if [[ -f "$ROOT_DIR/.env" ]]; then
    printf '[ok] using existing .env\n'
    return 0
  fi

  if [[ -f "$ROOT_DIR/.env.example" ]]; then
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
    printf '[info] .env missing, copied from .env.example\n'
    return 0
  fi

  printf '[error] .env and .env.example are both missing\n' >&2
  exit 1
}

ensure_mysql() {
  if is_port_listening 3306; then
    printf '[ok] MySQL already listening on 3306\n'
    return 0
  fi

  if command_exists brew; then
    printf '[start] MySQL via Homebrew\n'
    brew services start mysql >/dev/null || true
    for _ in $(seq 1 15); do
      if is_port_listening 3306; then
        printf '[ok] MySQL started via Homebrew\n'
        return 0
      fi
      sleep 1
    done
  fi

  if command_exists docker; then
    printf '[start] MySQL via docker compose\n'
    docker compose up -d mysql adminer
    for _ in $(seq 1 20); do
      if is_port_listening 3306; then
        printf '[ok] MySQL started via docker compose\n'
        return 0
      fi
      sleep 1
    done
  fi

  cat <<'EOF' >&2
[error] Unable to start MySQL automatically.
Please use one of the following:
  1. brew services start mysql
  2. docker compose up -d mysql adminer
Then retry: bash scripts/start-local-dev.sh
EOF
  exit 1
}

prepare_database() {
  printf '[sync] prisma client\n'
  npm run db:generate >/dev/null

  printf '[sync] prisma migrations\n'
  npm run db:migrate:deploy >/dev/null

  printf '[sync] prisma seed\n'
  npm run db:seed >/dev/null
}

ensure_env_file
ensure_mysql
prepare_database

start_process "guide-api" 8383 npm run dev:guide-api
start_process "app-api" 8788 npm run dev:app-api
start_process "frontend" 5173 npm run dev -- --host 0.0.0.0

wait_for_url "http://127.0.0.1:8383/health" "guide-api" || true
wait_for_url "http://127.0.0.1:8788/health" "app-api" || true
wait_for_url "http://127.0.0.1:5173/" "frontend" || true

cat <<EOF

Local dev services:
  frontend : http://127.0.0.1:5173/
  app-api  : http://127.0.0.1:8788/health
  guide-api: http://127.0.0.1:8383/health
  mysql    : 127.0.0.1:3306

Logs:
  $LOG_DIR/frontend.log
  $LOG_DIR/app-api.log
  $LOG_DIR/guide-api.log

Stop helper:
  bash scripts/stop-local-dev.sh
EOF
