# Prisma MySQL Prompt

当任务涉及 Prisma schema、MySQL 表结构、migration、seed、数据库联调或数据模型变更时，请优先遵循本 Prompt。

## 适用范围

- `server/prisma/schema.prisma`
- `server/prisma/migrations/*`
- `server/prisma/seed.ts`
- `DATABASE_URL`
- Prisma Client 生成与迁移命令

## 先看这些文档

- [MySQL 升级技术方案](file:///Users/bytedance/project/personal_travel_daily/docs/technical/mysql-upgrade-design.md)
- [App API Contract](file:///Users/bytedance/project/personal_travel_daily/docs/technical/app-api-contract.md)
- [本地联调排查文档](file:///Users/bytedance/project/personal_travel_daily/docs/technical/local-dev-troubleshooting.md)

## 硬约束

1. 数据库变更必须通过 `prisma migrate` 产出版本化 migration。
2. 不要把 `db:push` 当成正式主流程。
3. `guide-api` 端口固定为 `8383`，`app-api` 固定为 `8788`。
4. 日期字段在 API 返回时必须保持约定的序列化格式。
5. 删除相关数据默认优先遵循软删除策略。

## 执行原则

1. 先改 `schema.prisma`，再生成 migration，再更新 seed 或代码。
2. 如果新增字段影响接口输出，要同步检查 serializer 和 contract。
3. 如果新增权限或账号字段，要同步检查：
   - seed
   - auth 逻辑
   - 会话恢复
4. 如果迁移命令在本地失败，要区分：
   - `migrate dev`
   - `migrate deploy`
   - shadow database 权限
5. 涉及历史数据补齐时，优先用 migration SQL 或 seed 明确表达。

## 禁止事项

- 不要只改 Prisma schema 却不补 migration。
- 不要手工改数据库后把 schema 留在旧状态。
- 不要绕过现有端口和环境变量约定。
- 不要在未确认数据兼容性的情况下重构表结构命名。

## 推荐工作流

1. 修改 `server/prisma/schema.prisma`
2. 生成或补充 migration
3. 执行：
   - `npm run db:generate`
   - `npm run db:migrate` 或 `npm run db:migrate:deploy`
4. 如有默认数据，更新 `server/prisma/seed.ts`
5. 验证接口与页面行为

## 常见检查点

- migration 是否进入 `server/prisma/migrations/*`
- `migration_lock.toml` 是否保持一致
- Prisma Client 是否已刷新
- seed 是否仍能成功执行
- 本地数据库状态是否可通过 `db:migrate:status` 验证

## 完成后检查

- `npm run db:generate`
- `npm run db:migrate:status`
- 必要时 `npm run db:seed`
- 若数据模型影响接口，补测并更新文档
