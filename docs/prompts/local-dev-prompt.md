# Local Dev Prompt

当任务涉及本地启动、多服务联调、端口冲突、Docker / MySQL 环境切换、健康检查与联调排障时，请优先遵循本 Prompt。

## 适用范围

- 前端 dev server
- `app-api`
- `guide-api`
- MySQL / Docker
- `npm run dev:*`
- 本地联调排障

## 先看这些文档

- [本地联调排查文档](file:///Users/bytedance/project/personal_travel_daily/docs/technical/local-dev-troubleshooting.md)
- [README](file:///Users/bytedance/project/personal_travel_daily/README.md)
- [MySQL 升级技术方案](file:///Users/bytedance/project/personal_travel_daily/docs/technical/mysql-upgrade-design.md)

## 端口约定

- 前端：默认 `5173`
- `app-api`：`8788`
- `guide-api`：`8383`
- MySQL：`3306`
- Adminer：`8080`

## 硬约束

1. 本地联调优先复用现有启动脚本与 npm scripts。
2. `guide-api` 端口固定为 `8383`，不要随意变更。
3. `app-api` 端口固定为 `8788`。
4. 本地排障时优先看健康检查和端口占用，不要盲改代码。
5. 涉及数据库不可用时，优先确认 MySQL 与 Prisma 状态。

## 执行原则

1. 启动失败先判断是：
   - 端口占用
   - 数据库未启动
   - Prisma Client 未生成
   - migration 未应用
2. 联调顺序优先：
   - MySQL
   - `guide-api`
   - `app-api`
   - 前端
3. 验证顺序优先：
   - `GET /health`
   - `GET /api/app/health`
   - `GET /api/auth/session`
   - `GET /api/app/bootstrap`
4. 若已有旧进程占用端口，先确认是否是旧版本实例，再决定是否替换。

## 常用命令

```bash
npm run dev
npm run dev:app-api
npm run dev:guide-api
npm run dev:all
npm run dev:all:docker
npm run dev:stop
npm run dev:stop:docker
npm run db:generate
npm run db:migrate:deploy
npm run db:migrate:status
npm run db:seed
```

## 禁止事项

- 不要在未确认原因前反复重启所有服务。
- 不要忽略端口冲突导致的“其实跑的是旧进程”问题。
- 不要在数据库未就绪时把问题误判成前端 bug。
- 不要绕过现有脚本去制造新的本地启动入口，除非明确要沉淀到项目中。

## 完成后检查

- 健康检查是否通过
- 关键端口是否与约定一致
- 登录注册链路是否可用
- 若涉及管理员后台，`/api/admin/overview` 是否可访问
- 若涉及文档或脚本变化，README / troubleshooting 是否同步
