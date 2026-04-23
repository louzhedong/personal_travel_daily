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

如果你明确希望使用 Docker MySQL 方案：

```bash
npm run dev:all:docker
```

停止本地联调进程：

```bash
npm run dev:stop
```

停止 Docker 方案下的本地联调进程：

```bash
npm run dev:stop:docker
```

脚本会：

- 检查并补 `.env`
- 尝试启动 MySQL
- 自动执行 `db:generate`、`db:migrate:deploy`、`db:seed`
- 启动 `guide-api`
- 启动 `app-api`
- 启动前端 Vite
- 将日志写入 `.tools/dev-logs/`

`npm run dev:all:docker` 额外会：

- 优先停止 Homebrew MySQL，释放 `3306`
- 通过 `docker compose` 启动 `mysql` 与 `adminer`

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

Homebrew 方案：

```bash
brew services list | grep mysql
lsof -nP -iTCP:3306 -sTCP:LISTEN
```

Docker 方案：

```bash
docker compose ps
docker compose logs mysql --tail=80
```

### 2. Homebrew MySQL 启动报错

如果 `brew services start mysql` 后仍然是 `error`，优先检查 datadir 是否存在：

```bash
ls -la /opt/homebrew/var/mysql
```

如果目录缺失，执行首次初始化：

```bash
mkdir -p /opt/homebrew/var/mysql
/opt/homebrew/opt/mysql/bin/mysqld --initialize-insecure --user="$(whoami)" --basedir=/opt/homebrew/opt/mysql --datadir=/opt/homebrew/var/mysql
brew services restart mysql
```

### 3. MySQL 已启动但连不上

先看端口：

```bash
lsof -nP -iTCP:3306 -sTCP:LISTEN
```

再测试连接：

```bash
/opt/homebrew/bin/mysqladmin -u root ping
/opt/homebrew/bin/mysql -u root -e "SHOW DATABASES;"
```

### 4. 数据库或账号不存在

可用下面的方式重建：

```bash
/opt/homebrew/bin/mysql -u root -e "
CREATE DATABASE IF NOT EXISTS personal_travel_daily CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'travel_app'@'127.0.0.1' IDENTIFIED BY 'travel_app_password';
CREATE USER IF NOT EXISTS 'travel_app'@'localhost' IDENTIFIED BY 'travel_app_password';
GRANT ALL PRIVILEGES ON personal_travel_daily.* TO 'travel_app'@'127.0.0.1';
GRANT ALL PRIVILEGES ON personal_travel_daily.* TO 'travel_app'@'localhost';
FLUSH PRIVILEGES;"
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
/opt/homebrew/bin/mysql -u root -e "USE personal_travel_daily; SELECT id, name FROM accounts; SELECT id, name FROM travel_companions;"
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
- Prisma 还没 `db push`

优先检查：

- `.env`
- `3306` 端口
- `npm run db:push`

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

## 安全初始化说明

当前本地开发默认允许使用空密码的 `root` 初始化 MySQL。

如果你想把本机 MySQL 收得更规范，建议执行：

```bash
mysql_secure_installation
```

建议至少完成：

- 为 `root` 设置密码
- 删除匿名用户
- 禁止远程 root 登录
- 删除测试库

如果你给 `root` 加了密码，后续记得把本地排查命令中的 `mysql -u root` 改成带 `-p` 的版本。
