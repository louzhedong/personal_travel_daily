# App API Prompt

当任务涉及 `server/appApi` 的接口设计、路由组织、service/repository/serializer 分层、错误码、DTO 或前后端 API 契约同步时，请优先遵循本 Prompt。

## 适用范围

- `server/appApi/routes/*`
- `server/appApi/services/*`
- `server/appApi/repositories/*`
- `server/appApi/serializers/*`
- `server/appApi/types.ts`
- `docs/technical/app-api-contract.md`

## 先看这些文档

- [App API Contract](file:///Users/bytedance/project/personal_travel_daily/docs/technical/app-api-contract.md)
- [项目总览](file:///Users/bytedance/project/personal_travel_daily/docs/technical/project-overview.md)
- [登录注册 + 会话 + 管理员权限技术方案](file:///Users/bytedance/project/personal_travel_daily/docs/technical/auth-technical-design.md)

## 分层约定

- `routes/*`
  - 只做参数解析、调用 service、返回响应
- `services/*`
  - 承担业务规则与流程编排
- `repositories/*`
  - 承担 Prisma / DB 访问
- `serializers/*`
  - 把数据库结果转换为前端 DTO
- `types.ts`
  - 收口接口 DTO

## 硬约束

1. 路由层不要直接堆复杂业务逻辑。
2. 数据库查询优先下沉到 repository。
3. 返回给前端的 DTO 优先通过 serializer 收口。
4. 接口变更时必须同步更新 `docs/technical/app-api-contract.md`。
5. 错误返回统一走当前错误体系，不要临时拼裸字符串。
6. 鉴权接口必须复用 `requestAuth.ts` 中的统一能力。

## 执行原则

1. 先复用现有 route/service/repository/serializer 模式，再决定是否新增模块。
2. 如果接口是“聚合视图”，优先新增 service + serializer，不要在路由层拼装。
3. 如果字段是前后端共识，优先更新 `server/appApi/types.ts` 与 `src/lib/api/types.ts`。
4. 如果接口受登录态影响，优先明确：
   - `401`
   - `403`
   - `404`
   - `409`
   - `503`
5. 如果行为变化会影响联调，请同步更新 README 或联调文档入口。

## 禁止事项

- 不要在 route 里直接写大量 Prisma 查询。
- 不要让前端依赖“未记录在 contract 中”的隐式字段。
- 不要修改接口行为却不补测试和 contract。
- 不要绕开统一错误对象直接返回非标准错误格式。

## 推荐改动路径

### 新增接口

1. 先定义 schema / types
2. 再加 repository
3. 再加 service
4. 再加 serializer
5. 最后注册 route

### 修改接口返回结构

1. 先更新 serializer
2. 再更新 `server/appApi/types.ts`
3. 再更新 `src/lib/api/types.ts`
4. 再更新文档和测试

## 完成后检查

- 接口契约文档是否已更新
- 对应测试是否已补：
  - `server/__tests__/appApiRoutes.spec.ts`
- 前端 DTO 是否同步
- 错误码和鉴权行为是否仍一致
