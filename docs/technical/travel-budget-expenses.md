# 旅行预算与消费洞察 / Travel Budget and Expense Insights

旅行预算与消费洞察把记录中的粗粒度预算级别扩展为行程绑定的真实消费明细，并在行程详情、统计中心和年度回顾中形成私密复盘。

Travel Budget and Expense Insights extends coarse marker budget levels into trip-bound expense records, then surfaces private spending retrospectives in trip detail, stats, and annual reviews.

## 已落地范围 / Delivered Scope

- 新增 `TripExpense`，支持类别、金额、币种、日期、备注、旅伴和草稿/实际状态。
  Adds `TripExpense` with category, amount, currency, date, note, companion, and draft/actual status.
- 行程详情展示预算摘要、类别占比和人均估算。
  Shows budget summaries, category share, and per-person estimates in trip detail.
- 统计中心与年度回顾展示消费趋势，默认保持私密。
  Adds private spending trends to stats and annual reviews.
- 支持从规划项创建预算草稿，旅行后再转为实际支出。
  Supports creating budget drafts from planning items and converting them into actual expenses later.

## API 与数据 / APIs and Data

- `GET /api/expenses`
- `POST /api/expenses`
- `PATCH /api/expenses/:id`
- `DELETE /api/expenses/:id`
- `POST /api/expenses/from-planning/:tripId/:itemId`

Summary: These APIs stay account-scoped, typed through frontend/backend DTO folders, and follow the existing app-api authentication and error conventions.

## 关键文件 / Key Files

- `server/appApi/services/expenseService.ts`
- `server/appApi/repositories/expenseRepository.ts`
- `src/modules/expenses/TripExpensePanel.tsx`
- `src/modules/expenses/expenseModel.ts`

Summary: The implementation keeps route/service/repository/serializer boundaries on the backend and page/model/API/style boundaries on the frontend.

## 验证 / Verification

- `server/__tests__/expenseService.spec.ts`
- `server/__tests__/appApiRoutes.expenses.spec.ts`
- `src/modules/__tests__/expenseModel.spec.ts`

Summary: Focused tests cover the newly added service, route, model, export, or page behavior for this capability.
