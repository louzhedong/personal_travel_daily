# 主动提醒与异常告警 / Proactive Reminders and Anomaly Alerts

主动提醒与异常告警把后台质量巡检、账号会话治理、行前规划和攻略来源健康信号转为低打扰应用内提醒。

Proactive Reminders and Anomaly Alerts turn admin quality checks, account-session governance, trip planning, and guide-source health signals into low-noise in-app reminders.

## 已落地范围 / Delivered Scope

- 新增 `/reminders` 提醒中心，聚合过期规划、缺封面、缺照片说明、异常登录和攻略来源异常。
  Adds the `/reminders` center for overdue planning, missing covers, missing captions, anomalous logins, and guide-source anomalies.
- 支持按类型静音、单条标记已处理和跳转定位。
  Supports type-level muting, per-reminder resolution, and navigation targets.
- 管理员可查看跨账号提醒趋势，但不能越权查看私密内容。
  Admins can view cross-account reminder trends without accessing private content beyond permission boundaries.
- 第一阶段仅做应用内低打扰提醒，不做邮件、Webhook 或外部推送。
  Phase one is in-app and low-noise only; it does not send email, webhook, or external notifications.

## API 与数据 / APIs and Data

- `GET /api/reminders`
- `POST /api/reminders/:fingerprint/resolve`
- `POST /api/reminders/preferences/:type/mute`
- `DELETE /api/reminders/preferences/:type/mute`
- `GET /api/admin/reminders/trends`

Summary: These APIs stay account-scoped, typed through frontend/backend DTO folders, and follow the existing app-api authentication and error conventions.

## 关键文件 / Key Files

- `server/appApi/services/reminderService.ts`
- `server/appApi/repositories/reminderRepository.ts`
- `src/modules/reminders/ReminderCenterPage.tsx`
- `src/modules/reminders/reminderModel.ts`

Summary: The implementation keeps route/service/repository/serializer boundaries on the backend and page/model/API/style boundaries on the frontend.

## 验证 / Verification

- `server/__tests__/appApiRoutes.reminders.spec.ts`
- `src/modules/__tests__/ReminderCenterPage.spec.tsx`
- `src/modules/__tests__/reminderModel.spec.ts`

Summary: Focused tests cover the newly added service, route, model, export, or page behavior for this capability.
