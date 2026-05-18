# Architecture Phase 1 Test Checklist

## Scope / 范围

- 中文：本清单仅覆盖 Phase 1 架构拆分：Stats 聚合器真实分域、顶层路由渲染 registry、App API 路由测试按领域拆分。
- English: This checklist only covers the Phase 1 architecture split: real Stats aggregator domains, top-level route renderer registry, and domain-split App API route tests.

## Automated Checks / 自动化检查

- 中文：运行 Stats 聚合器与服务测试，确认过滤、排行、成就、年度回顾和对外 barrel 导出保持兼容。
- English: Run Stats aggregator and service tests to verify filters, rankings, achievements, annual review, and public barrel exports remain compatible.

```bash
npm run test -- server/__tests__/statsAggregator.spec.ts server/__tests__/statsService.spec.ts
```

- 中文：运行 App 顶层路由测试，确认 renderer registry 未改变鉴权后页面分发、回退和导航行为。
- English: Run App shell route tests to verify the renderer registry preserves authenticated page dispatch, fallback, and navigation behavior.

```bash
npm run test -- src/modules/__tests__/App.spec.tsx src/modules/app/__tests__/router.spec.ts
```

- 中文：运行拆分后的 App API 路由领域测试，确认 smoke、账号、后台、统计、行程、照片、旅伴、记录和攻略路由仍按原合同调用服务层。
- English: Run the split App API route domain tests to verify smoke, account, admin, stats, trips, photos, companions, markers, and guides routes still call services with the original contract.

```bash
npm run test -- server/__tests__/appApiRoutes*.spec.ts
```

## Manual Review / 人工核对

- 中文：确认 `server/appApi/services/stats/aggregator/core.ts` 不再承载所有实现，只作为兼容导出层。
- English: Confirm `server/appApi/services/stats/aggregator/core.ts` no longer owns all implementation and only acts as a compatibility export layer.

- 中文：确认 `src/modules/app/routeRenderers.tsx` 新增页面时只需注册 renderer，不需要继续扩展长 `if` 链。
- English: Confirm `src/modules/app/routeRenderers.tsx` only requires registering a renderer for new pages instead of extending a long `if` chain.

- 中文：确认 `server/__tests__/appApiRoutes.spec.ts` 仅保留少量跨域 smoke，领域用例分散到相邻 `appApiRoutes.*.spec.ts` 文件。
- English: Confirm `server/__tests__/appApiRoutes.spec.ts` keeps only a small cross-domain smoke suite while domain cases live in adjacent `appApiRoutes.*.spec.ts` files.

## Exit Criteria / 完成标准

- 中文：上述定向测试全部通过，并且没有新增 TypeScript / ESLint 诊断。
- English: All targeted tests above pass, with no new TypeScript or ESLint diagnostics.

- 中文：除 Phase 1 范围文件外，不修改后续阶段功能或已有未提交 roadmap 内容。
- English: Do not modify later-phase functionality or existing uncommitted roadmap content outside the Phase 1 scope.
