# 旅行成就系统 / Travel Achievements

这份文档记录当前已落地的旅行成就系统。它描述的是仓库中的真实实现，不是未来态方案。

This document records the travel-achievement system as it exists in the repository. It describes shipped behavior, not future design.

## 1. 产品定位 / Product Positioning

旅行成就把统计中心从“看数据”推进到“看到自己的旅行里程碑”。它复用现有旅行记录、行程、照片、攻略、旅伴和轻量元数据聚合，不把成就进度拆成新的业务主数据。

Travel achievements turn the stats center from raw analytics into personal travel milestones. They reuse existing markers, trips, photos, guides, companions, and lightweight metadata instead of creating a separate source of truth for progress.

当前成就展示在两个入口：

- `/stats` 统计中心：展示全局旅行成就，跟随当前统计筛选实时变化。
- `/yearbook/:year` 年度回顾：展示年度成就，固定在当前年份视图内计算。

Current surfaces:

- `/stats`: global travel achievements, recomputed live against the active stats filters.
- `/yearbook/:year`: annual achievements, computed within the selected year.

## 2. 成就 DTO / Achievement DTO

前后端共享同一组字段语义，定义位于 `server/appApi/types.ts` 和 `src/lib/api/types.ts`。

The frontend and backend share the same field semantics through `server/appApi/types.ts` and `src/lib/api/types.ts`.

```ts
interface StatsAchievementDto {
  id: string;
  title: string;
  description: string;
  category: 'footprint' | 'rhythm' | 'companion' | 'content' | 'style';
  status: 'unlocked' | 'close' | 'locked';
  progressValue: number;
  progressTarget: number;
  remainingValue?: number;
  unit: string;
  evidence?: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
  firstUnlockedAt?: string;
}
```

`close` 的口径固定为：进度达到目标的 60% 及以上，但尚未达成。`remainingValue` 只表达距离目标还差多少；已达成时为 `0`。

`close` means progress is at least 60% of the target but not yet unlocked. `remainingValue` expresses the remaining gap and is `0` once unlocked.

## 3. 全局成就 / Global Achievements

`GET /api/stats/overview` 返回 12 个固定全局成就：

| ID | 标题 | 分类 | 目标 |
| --- | --- | --- | --- |
| `city-explorer` | 城市探索者 | `footprint` | 覆盖 5 座城市 |
| `cross-city-traveler` | 跨城旅人 | `footprint` | 覆盖 10 座城市 |
| `first-international-trip` | 世界初体验 | `footprint` | 有 1 条国际记录 |
| `country-collector` | 国家收藏家 | `footprint` | 覆盖 3 个国际国家 / 地区 |
| `long-trip` | 长线旅行者 | `rhythm` | 最长行程达到 5 天 |
| `frequent-departure` | 高频出发 | `rhythm` | 累计旅行天数达到 30 天 |
| `monthly-streak` | 连续脚步 | `rhythm` | 连续 3 个月有旅行记录 |
| `shared-memory` | 同行记忆 | `companion` | 与 2 位以上旅伴留下记录 |
| `guide-planner` | 攻略派 | `content` | 关联或收藏攻略达到 5 篇 |
| `photo-keeper` | 摄影记录者 | `content` | 照片达到 20 张 |
| `citywalk-lover` | 城市漫游家 | `style` | `citywalk` 标签达到 3 条 |
| `rail-flight-traveler` | 铁道/飞行偏好 | `style` | `train` 或 `plane` 交通记录达到 3 条 |

这些成就基于当前统计筛选后的 markers / trips / guides 计算，所以年份、范围、旅伴、行程、标签、心情、天气、交通和预算筛选都会影响成就状态。

These achievements are computed from the markers / trips / guides left after the active stats filters, so year, scope, companion, trip, tag, mood, weather, transport, and budget filters all affect status.

## 4. 年度成就 / Annual Achievements

`GET /api/stats/annual-review?year=YYYY` 返回年度成就，当前固定为：

- `annual-${year}-travel-days`：年度出发王，这一年旅行天数达到 20 天。
- `annual-${year}-photo-keeper`：年度摄影手，这一年旅行照片达到 30 张。
- `annual-${year}-shared-memory`：年度同行记忆，这一年与 2 位以上旅伴同行。

Annual review currently returns:

- `annual-${year}-travel-days`: 20 travel days in the year.
- `annual-${year}-photo-keeper`: 30 photos in the year.
- `annual-${year}-shared-memory`: 2 or more companions in the year.

## 5. 计算与持久化 / Computation and Persistence

聚合逻辑集中在 `server/appApi/services/stats/aggregator.ts`，保持无 Prisma / I/O 副作用。`buildAchievements()` 负责全局成就，`buildAnnualAchievements()` 负责年度成就。

Aggregation lives in `server/appApi/services/stats/aggregator.ts` and remains Prisma / I/O free. `buildAchievements()` handles global achievements and `buildAnnualAchievements()` handles annual achievements.

首次解锁时间单独存入 `AchievementUnlock`，数据库表为 `achievement_unlocks`。唯一约束是：

```text
account_id + achievement_id + period_key
```

`period_key` 当前有两种形态：

- `global`：默认全量统计视图的全局成就。
- `annual:${year}`：年度回顾里的年度成就。

筛选后的 `/stats` 视图只实时计算，不写 `achievement_unlocks`。这样可以让筛选态成就跟随视图变化，同时避免把临时切片永久写成用户历史。

Filtered `/stats` views are computed live and do not write `achievement_unlocks`. This keeps slice-specific achievements responsive without turning temporary filters into permanent user history.

## 6. 前端展示 / Frontend Display

统计中心在摘要卡片之后展示成就区块，默认展示 6 个重点成就，并提供“展开全部 / 收起”。成就卡片展示分类、状态、进度条和进度文案；点击卡片打开成就详情弹窗。

The stats center places achievements after the summary cards. It shows 6 key cards by default and supports expand / collapse. Cards display category, status, progress bar, and progress text; clicking a card opens the detail dialog.

详情弹窗展示：

- 标题、分类、状态和进度。
- 达成证据列表。
- 首次解锁时间。

年度回顾在高光区域之后展示年度成就，复用同一 DTO 和进度语义。

Annual review displays annual achievements after the highlights section and reuses the same DTO and progress semantics.

## 7. 滚动与弹窗约束 / Dialog and Scroll Rules

成就详情使用通用 `Dialog`。弹窗打开期间会锁定 `document.body` 滚动，并通过 `overscroll-behavior: contain` 阻止弹窗内部滚动穿透到背景页面。

Achievement detail uses the shared `Dialog`. While open, it locks `document.body` scrolling and uses `overscroll-behavior: contain` to prevent inner dialog scrolling from leaking into the background page.

后续任何可滚动弹窗都应复用 `src/components/ui/Dialog.tsx`，不要在业务组件内重复手写 body lock。

Future scrollable dialogs should reuse `src/components/ui/Dialog.tsx` instead of reimplementing body locking inside business components.

## 8. 验证范围 / Validation

当前测试覆盖：

- 服务端成就聚合：已解锁、接近达成、未达成、空数据、筛选后重新计算。
- API 契约：`GET /api/stats/overview` 和 `GET /api/stats/annual-review` 返回 `achievements`。
- 前端展示：统计中心成就卡片、展开收起、详情弹窗、空态和年度回顾成就。
- 回归：统计筛选、排行、热力图、行程详情钻取和弹窗滚动隔离。

Current tests cover backend aggregation, API contracts, stats-center UI, annual-review UI, and regressions around filters, rankings, heatmaps, trip drill-down, and dialog scroll containment.
