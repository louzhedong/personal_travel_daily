# 账号设置与会话治理 / Account Settings and Session Governance

## 1. 目标 / Goal

账号设置与会话治理新增 `/settings`，把账号资料、密码修改、多设备会话和数据导出收敛到登录后的账号级页面。

Account Settings and Session Governance adds `/settings`, consolidating profile details, password changes, multi-device sessions, and data export into an authenticated account-level page.

本功能延续 Cookie Session 安全模型：浏览器保存原始 token，数据库只保存 SHA-256 hash。

This feature keeps the Cookie Session security model: the browser stores the raw token, while the database only stores the SHA-256 hash.

## 2. 数据模型 / Data Model

`AuthSession` 新增设备与活跃状态字段：

`AuthSession` now stores device and activity metadata:

```prisma
userAgent  String?  @map("user_agent") @db.Text
ipAddress  String?  @map("ip_address")
lastSeenAt DateTime @default(now()) @map("last_seen_at")
revokedAt  DateTime? @map("revoked_at")
```

登录和注册会写入 `userAgent` 与 `ipAddress`，恢复 session 时会更新 `lastSeenAt`。

Login and registration write `userAgent` and `ipAddress`; session restoration updates `lastSeenAt`.

## 3. API / API

### GET `/api/account/settings`

返回当前账号资料、创建时间和更新时间。

Returns current account details, creation time, and update time.

### PATCH `/api/account/profile`

只允许修改昵称 `name`。

Only updates the profile display name `name`.

### PATCH `/api/account/password`

校验当前密码后更新密码。成功后保留当前 session，并删除其他 sessions。

Updates the password after validating the current password. On success, the current session is preserved and other sessions are removed.

### GET `/api/account/sessions`

返回当前账号未过期、未撤销的 sessions，并标记当前设备。

Returns active non-expired sessions for the current account and marks the current device.

### DELETE `/api/account/sessions/:sessionId`

退出其他设备。不允许用该接口删除当前 session，当前设备继续使用普通退出登录。

Logs out another device. The current session cannot be deleted through this endpoint; the current device still uses normal logout.

### POST `/api/account/sessions/logout-all`

退出全部设备并清空当前 cookie。

Logs out all devices and clears the current cookie.

## 4. 前端 / Frontend

`/settings` 页面包含：

The `/settings` page includes:

- 账号资料 / Account profile
- 密码修改 / Password change
- 会话列表 / Session list
- 数据导出 / Data export

首页 Hero 增加 `账号设置` 入口。

The homepage hero adds an `账号设置` entry point.

数据导出复用 `DataSync`，仍只导出当前聚合快照，不恢复导入。

Data export reuses `DataSync`; it still exports the current aggregate snapshot only and does not restore imports.

## 5. 分层 / Layering

- `server/appApi/routes/accountSettings.ts`：账号设置 HTTP routes。
- `server/appApi/schemas/accountSettings.ts`：profile、password、session params 校验。
- `server/appApi/services/accountSettingsService.ts`：账号资料、密码和会话治理规则。
- `server/appApi/repositories/accountSettingsRepository.ts`：账号和 session Prisma 查询。
- `src/lib/api/accountSettingsApi.ts`：前端 API client。
- `src/modules/settings/AccountSettingsPage.tsx`：设置页容器。
- `src/modules/settings/accountSettingsPageModel.ts`：日期、角色、session 分组 helper。
- `src/styles/features/account-settings.css`：设置页样式。

Summary: The implementation follows existing routes → schemas → services → repositories layering and keeps frontend API, page, view-model helpers, and styles separated.

## 6. 会话策略 / Session Policy

- 当前 session 使用 cookie token hash 识别。
- `GET /api/auth/session` 命中有效 session 后更新 `lastSeenAt`。
- 修改密码成功后删除其他 sessions，保留当前 session。
- 退出其他设备只允许删除非当前 session。
- 退出全部设备删除当前账号所有 sessions，并清空 cookie。

Session policy:

- The current session is identified by the cookie token hash.
- `GET /api/auth/session` updates `lastSeenAt` after a valid session hit.
- A successful password change removes other sessions and keeps the current one.
- Logging out another device only removes non-current sessions.
- Logging out all devices removes all sessions for the account and clears the cookie.

## 7. 测试 / Tests

- `server/__tests__/accountSettingsService.spec.ts`：账号资料、密码、会话列表和退出设备。
- `server/__tests__/authService.spec.ts`：登录 / 注册 session metadata。
- `server/__tests__/appApiRoutes.spec.ts`：账号设置 HTTP routes。
- `src/modules/__tests__/AccountSettingsPage.spec.tsx`：设置页表单、会话操作、Toast 和数据导出入口。
- `src/modules/__tests__/App.spec.tsx`：`/settings` 路由和首页入口。

Tests cover backend service rules, route wiring, page interactions, session actions, and app routing.

## 8. 边界 / Boundaries

- 不做邮箱、手机号、验证码或 OAuth。
- 不做找回密码。
- 不做二次验证。
- 不做设备地理位置解析。
- 不恢复 JSON 导入。
- 不做删除账号。

Boundaries:

- No email, phone, verification code, or OAuth.
- No password recovery.
- No two-factor authentication.
- No device geolocation parsing.
- No JSON import restore.
- No account deletion.
