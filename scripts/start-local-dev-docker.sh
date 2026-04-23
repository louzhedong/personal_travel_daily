#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.tools/dev-logs"
RUN_DIR="$ROOT_DIR/.tools/run"

mkdir -p "$LOG_DIR" "$RUN_DIR"
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

  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
  printf '[info] .env missing, copied from .env.example\n'
}

prepare_database() {
  printf '[sync] prisma client\n'
  npm run db:generate >/dev/null

  printf '[sync] prisma migrations\n'
  npm run db:migrate:deploy >/dev/null

  printf '[sync] prisma seed\n'
  npm run db:seed >/dev/null
}

DOCKER_BIN="$(find_docker_bin || true)"
if [[ -z "$DOCKER_BIN" ]]; then
  echo "[error] Docker CLI not found. Please install/start Docker Desktop." >&2
  exit 1
fi

ensure_env_file

if command -v brew >/dev/null 2>&1 && brew services list | grep -q "^mysql.*started"; then
  printf '[stop] stopping Homebrew MySQL to free 3306 for Docker\n'
  brew services stop mysql >/dev/null || true
  sleep 3
fi

printf '[start] docker compose mysql + adminer\n'
"$DOCKER_BIN" compose up -d mysql adminer

wait_for_url "http://127.0.0.1:8080/" "adminer" || true
prepare_database

start_process "guide-api" 8383 npm run dev:guide-api
start_process "app-api" 8788 npm run dev:app-api
start_process "frontend" 5173 npm run dev -- --host 0.0.0.0

wait_for_url "http://127.0.0.1:8383/health" "guide-api" || true
wait_for_url "http://127.0.0.1:8788/health" "app-api" || true
wait_for_url "http://127.0.0.1:5173/" "frontend" || true

cat <<EOF

Docker local dev services:
  frontend : http://127.0.0.1:5173/
  app-api  : http://127.0.0.1:8788/health
  guide-api: http://127.0.0.1:8383/health
  mysql    : 127.0.0.1:3306
  adminer  : http://127.0.0.1:8080/

Logs:
  $LOG_DIR/frontend.log
  $LOG_DIR/app-api.log
  $LOG_DIR/guide-api.log

Stop helper:
  bash scripts/stop-local-dev-docker.sh
EOF
