# Local Dev Troubleshooting

这份文档用于排查本地联调环境，覆盖：

- MySQL 启动问题
- `app-api` / `guide-api` / 前端 dev server 启动问题
- 端口占用
- Prisma 连接和 schema 同步问题
- 一键联调脚本的日志定位

## 推荐启动方式

优先使用一键联调脚本：

```bash
npm run dev:all
```

停止本地联调进程：

```bash
npm run dev:stop
```

脚本会：

- 检查并补 `.env`
- 通过 `docker compose` 启动 `mysql` 与 `adminer`
- 自动执行 `db:generate`、`db:migrate:deploy`、`db:seed`
- 启动 `guide-api`
- 启动 `app-api`
- 启动前端 Vite
- 将日志写入 `.tools/dev-logs/`

## 默认地址

- 前端：`http://127.0.0.1:5173/`
- 主业务 API：`http://127.0.0.1:8788/health`
- 攻略 API：`http://127.0.0.1:8383/health`
- MySQL：`127.0.0.1:3306`

## 日志位置

一键联调脚本生成的日志默认位于：

- `.tools/dev-logs/frontend.log`
- `.tools/dev-logs/app-api.log`
- `.tools/dev-logs/guide-api.log`

PID 文件位于：

- `.tools/run/frontend.pid`
- `.tools/run/app-api.pid`
- `.tools/run/guide-api.pid`

## MySQL 排查

### 1. 看 MySQL 是否真的启动

```bash
docker compose ps
docker compose logs mysql --tail=80
```

### 2. MySQL 已启动但连不上

先看端口：

```bash
lsof -nP -iTCP:3306 -sTCP:LISTEN
```

再测试连接：

```bash
docker compose exec mysql mysqladmin ping -h 127.0.0.1 -ppassword
docker compose exec mysql mysql -utravel_app -ptravel_app_password personal_travel_daily -e "SHOW TABLES;"
```

### 3. 数据库或账号不存在

Docker MySQL 会按 `docker-compose.yml` 自动创建数据库和账号。若需要重建容器数据，可停止服务后重置 Docker volume：

```bash
docker compose down -v
npm run dev:all
```

## Prisma 排查

### 1. `P1001 Can't reach database server`

含义：

- `DATABASE_URL` 指向的 MySQL 没启动
- 或 `127.0.0.1:3306` 没监听

排查步骤：

1. 确认 `.env` 中的 `DATABASE_URL`
2. 确认 `3306` 端口在监听
3. 再执行：

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 2. schema 没同步

执行：

```bash
npm run db:push
```

如果只是想重新生成 Prisma Client：

```bash
npm run db:generate
```

### 3. seed 没写进去

执行：

```bash
npm run db:seed
```

然后检查：

```bash
docker compose exec mysql mysql -utravel_app -ptravel_app_password personal_travel_daily -e "SELECT id, name FROM accounts; SELECT id, name FROM travel_companions;"
```

## app-api 排查

### 1. 服务没起来

手动启动：

```bash
npm run dev:app-api
```

健康检查：

```bash
curl -s http://127.0.0.1:8788/health
curl -s http://127.0.0.1:8788/api/app/bootstrap
```

### 2. `bootstrap` 返回 503

这通常表示：

- MySQL 没启动
- `DATABASE_URL` 不对
- Prisma migration 还没应用

优先检查：

- `.env`
- `3306` 端口
- `npm run db:migrate:deploy`

## guide-api 排查

### 1. 服务没起来

手动启动：

```bash
npm run dev:guide-api
```

健康检查：

```bash
curl -s http://127.0.0.1:8383/health
```

### 2. 页面搜索攻略失败

检查：

- `.env` 中 `VITE_GUIDE_SEARCH_PROVIDER`
- `guide-api` 是否已启动
- 浏览器网络请求是否命中 `8383`

## 前端排查

### 1. 页面打不开

手动启动：

```bash
npm run dev -- --host 0.0.0.0
```

检查端口：

```bash
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

### 2. 页面没有拿到 bootstrap 数据

检查：

```bash
curl -s http://127.0.0.1:8788/api/app/bootstrap
```

然后再看：

- 浏览器 Network 是否请求了 `/api/app/bootstrap`
- `app-api` 日志中是否出现该请求
- `VITE_APP_API_BASE_URL` 是否还是 `/api/app`

## 端口占用排查

查看常用端口占用：

```bash
lsof -nP -iTCP:3306 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
lsof -nP -iTCP:8383 -sTCP:LISTEN
lsof -nP -iTCP:8788 -sTCP:LISTEN
```

如果需要释放某个端口对应的进程：

```bash
kill <PID>
```

## Docker 数据说明

本地 MySQL 数据保存在 Docker volume `personal_travel_daily_mysql_data` 中。普通停止命令只停止容器，不删除数据：

```bash
npm run dev:stop
```

如果确实需要清空本地 MySQL 数据，再执行：

```bash
docker compose down -v
```
