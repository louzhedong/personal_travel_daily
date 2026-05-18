# 攻略质量评分与来源优先级 / Guide Quality Scoring and Source Priority

攻略质量评分在既有搜索日志和来源健康度之上，为搜索结果提供可解释的质量标签，并让后台可以配置来源优先级与降权建议。

Guide Quality Scoring builds on existing search logs and source health to provide explainable result-quality badges and admin-configurable source priority or downranking hints.

## 已落地范围 / Delivered Scope

- 综合来源健康度、摘要完整度、关键词命中、正文可读性和历史保存率计算质量。
  Combines source health, summary completeness, keyword hits, readability, and historical save rate into quality scoring.
- 前端以克制徽标解释“高相关 / 内容完整 / 来源稳定”。
  Shows restrained badges explaining high relevance, content completeness, and stable sources.
- 后台可维护来源优先级和降权建议，不直接删除来源。
  Allows admins to maintain source priority and downranking suggestions without deleting sources directly.
- LLM 不可用时仍通过规则引擎完成评分。
  Falls back to a rule-based scorer when LLM features are unavailable.

## API 与数据 / APIs and Data

- `GET /api/guide-source-health`
- `PATCH /api/guide-source-health/preferences`

Summary: These APIs stay account-scoped, typed through frontend/backend DTO folders, and follow the existing app-api authentication and error conventions.

## 关键文件 / Key Files

- `server/appApi/services/guideQualityService.ts`
- `server/appApi/services/guideSourceHealthService.ts`
- `src/components/GuideSearchResultList.tsx`
- `src/components/admin/AdminGuideSourceHealthPanel.tsx`

Summary: The implementation keeps route/service/repository/serializer boundaries on the backend and page/model/API/style boundaries on the frontend.

## 验证 / Verification

- `server/__tests__/guideQualityService.spec.ts`
- `server/__tests__/guideSearchLogService.spec.ts`
- `src/components/__tests__/GuideSearchPanel.spec.tsx`

Summary: Focused tests cover the newly added service, route, model, export, or page behavior for this capability.
