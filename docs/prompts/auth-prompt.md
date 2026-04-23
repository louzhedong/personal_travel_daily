# Auth Prompt

当任务涉及登录、注册、会话恢复、退出登录、Cookie Session 或管理员权限时，请优先遵循本 Prompt。

## 适用范围

- 登录页与注册页
- `GET /api/auth/session`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- session cookie 与会话恢复
- `Account.role`
- 管理员访问 `/admin`

## 先看这些文档

- [登录注册 + 会话 + 管理员权限技术方案](file:///Users/bytedance/project/personal_travel_daily/docs/technical/auth-technical-design.md)
- [认证模块架构图](file:///Users/bytedance/project/personal_travel_daily/docs/technical/auth-architecture-diagram.md)
- [登录注册与会话管理时序图](file:///Users/bytedance/project/personal_travel_daily/docs/technical/auth-sequence-diagrams.md)
- [App API Contract](file:///Users/bytedance/project/personal_travel_daily/docs/technical/app-api-contract.md)

## 关键代码入口

- 前端：
  - `src/modules/App.tsx`
  - `src/modules/auth/AuthPage.tsx`
  - `src/lib/api/authApi.ts`
  - `src/lib/api/httpClient.ts`
- 后端：
  - `server/appApi/routes/auth.ts`
  - `server/appApi/services/authService.ts`
  - `server/appApi/auth/requestAuth.ts`
  - `server/appApi/auth/session.ts`
  - `server/appApi/repositories/authSessionRepository.ts`
  - `server/prisma/schema.prisma`

## 硬约束

1. 认证路由必须使用 `/login` 与 `/register`，`/auth` 仅做兼容跳转。
2. 当前会话机制是 Cookie Session，不要擅自改成 JWT。
3. session 真值在后端，前端不能自己伪造登录态。
4. 管理员权限真值在 `Account.role`，不要用用户名白名单替代。
5. 普通注册用户默认 `role = member`。
6. 默认种子账号保持 `role = admin`。
7. 敏感/破坏性操作继续使用二次确认交互。
8. 认证相关接口行为变更时，必须同步更新技术文档与接口契约。

## 执行原则

1. 优先复用 `authService.ts`、`requestAuth.ts`、`session.ts`，不要在路由层堆业务逻辑。
2. 若涉及 session 行为，优先考虑：
   - token 如何生成
   - tokenHash 如何落库
   - cookie 如何写入和清理
   - 会话恢复是否受影响
3. 若涉及权限行为，先区分：
   - 前端体验分流
   - 后端真实权限裁决
4. 注册链路改动时，同时检查：
   - 默认同行人初始化
   - 注册后自动登录
   - `/api/auth/session` 返回结构
5. 管理员逻辑改动时，同时检查 `/admin` 路由与 `/api/admin/overview`。

## 禁止事项

- 不要在前端 localStorage 保存登录态真值。
- 不要把密码明文写入数据库。
- 不要把原始 session token 存入数据库。
- 不要只改前端路由而不补后端鉴权。
- 不要绕开 `requestAuth.ts` 自己手写另一套鉴权判断。

## 常见任务的推荐改动路径

### 登录注册表单交互

- 前端优先改：
  - `src/modules/auth/AuthPage.tsx`
  - `src/modules/App.tsx`
  - `src/lib/api/authApi.ts`

### Session 生成、恢复、失效

- 后端优先改：
  - `server/appApi/services/authService.ts`
  - `server/appApi/auth/session.ts`
  - `server/appApi/auth/requestAuth.ts`
  - `server/appApi/repositories/authSessionRepository.ts`

### 管理员权限

- 数据模型：
  - `server/prisma/schema.prisma`
- 鉴权入口：
  - `server/appApi/auth/requestAuth.ts`
- 后台接口：
  - `server/appApi/routes/admin.ts`
- 前端路由：
  - `src/modules/App.tsx`

## 完成后检查

- 登录、注册、刷新恢复登录是否仍正常
- `/api/auth/session` 返回结构是否正确
- 普通用户访问 `/admin` 是否被拦截
- 管理员访问 `/admin` 是否正常
- 接口契约与技术文档是否同步
- 测试是否需要更新：
  - `server/__tests__/appApiRoutes.spec.ts`
  - `server/__tests__/authService.spec.ts`
  - `src/modules/__tests__/App.spec.tsx`
