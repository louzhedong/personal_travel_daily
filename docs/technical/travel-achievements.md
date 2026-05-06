# 旅行成就系统 / Travel Achievements

这份文档记录当前仓库里已经落地的旅行成就系统，包含真实接口、前端入口、持久化语义和测试边界。

This document records the shipped travel-achievement system in the repository, including the real API contract, frontend surfaces, persistence semantics, and test boundaries.

## 1. 产品定位 / Product Positioning

旅行成就把“统计”扩展成“旅行里程碑回看”。它不引入新的成就主数据，而是复用已有的记录、行程、照片、攻略、旅伴和轻量元数据做纯聚合。

Travel achievements turn analytics into personal milestone review. They do not introduce a separate achievement source of truth; instead, they derive progress from markers, trips, photos, guides, companions, and lightweight metadata.

当前成就有 3 个展示入口：

There are now 3 shipped surfaces for achievements:

- `/stats`：展示账号级成就和连续年度成就，跟随统计筛选实时变化。
- `/yearbook/:year`：展示当前年份的年度限定成就。
- `/achievements`：聚合账号级、连续年度和所有年份年度成就的独立总览页。

- `/stats`: shows account-level achievements plus consecutive-year streak achievements, recomputed live with the active stats filters.
- `/yearbook/:year`: shows annual-limited achievements for the selected year.
- `/achievements`: a standalone atlas page that combines account-level, streak, and all-year annual achievements.

## 2. 成就 DTO / Achievement DTO

前后端共享同一组字段语义，定义位于 `server/appApi/types.ts` 和 `src/lib/api/types.ts`。

The frontend and backend share the same field semantics through `server/appApi/types.ts` and `src/lib/api/types.ts`.

```ts
type StatsAchievementCategoryDto = 'footprint' | 'rhythm' | 'companion' | 'content' | 'style';
type StatsAchievementStatusDto = 'unlocked' | 'close' | 'locked';
type StatsAchievementRarityDto = 'common' | 'rare' | 'epic' | 'legendary';
type StatsAchievementGroupDto =
  | 'footprint'
  | 'rhythm'
  | 'companion'
  | 'content'
  | 'style'
  | 'annual'
  | 'streak';
type StatsAchievementPeriodTypeDto = 'global' | 'annual' | 'streak';

interface StatsAchievementDto {
  id: string;
  title: string;
  description: string;
  category: StatsAchievementCategoryDto;
  group: StatsAchievementGroupDto;
  periodType: StatsAchievementPeriodTypeDto;
  rarity: StatsAchievementRarityDto;
  status: StatsAchievementStatusDto;
  progressValue: number;
  progressTarget: number;
  remainingValue?: number;
  unit: string;
  evidence?: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
  streakYears?: string[];
  nextHint?: string;
  firstUnlockedAt?: string;
}
```

字段语义补充：

Field semantics:

- `close`：进度达到目标的 60% 及以上，但尚未解锁。
- `group`：用于独立成就页分组，不改变原始 `category` 业务语义。
- `periodType`：区分账号级成就、年度限定成就和连续年度成就。
- `rarity`：当前用于 UI 徽标和视觉权重。
- `streakYears`：仅连续年度成就使用，记录当前最长连续年份链路。
- `nextHint`：当成就未达成时，给出下一步最接近的提示文案。

- `close`: progress is at least 60% of the target but not yet unlocked.
- `group`: supports atlas-page grouping without changing the original business `category`.
- `periodType`: distinguishes account-level, annual, and streak achievements.
- `rarity`: powers UI badges and visual emphasis.
- `streakYears`: used only by streak achievements to expose the longest consecutive-year chain.
- `nextHint`: gives the next closest action hint for non-unlocked achievements.

## 3. 成就目录 / Achievement Catalog

`GET /api/stats/overview` 在默认全量视图下返回 14 个成就：12 个账号级成就 + 2 个连续年度成就。

`GET /api/stats/overview` returns 14 achievements in the default all-data view: 12 account-level achievements plus 2 streak achievements.

### 3.1 账号级成就 / Account-Level Achievements

| ID | 标题 | `group` | 目标 |
| --- | --- | --- | --- |
| `city-explorer` | 城市探索者 | `footprint` | 覆盖 5 座不同城市 |
| `cross-city-traveler` | 跨城旅人 | `footprint` | 覆盖 10 座不同城市 |
| `first-international-trip` | 世界初体验 | `footprint` | 留下 1 条国际旅行记录 |
| `country-collector` | 国家收藏家 | `footprint` | 覆盖 3 个国际国家或地区 |
| `long-trip` | 长线旅行者 | `rhythm` | 最长行程达到 5 天 |
| `frequent-departure` | 高频出发 | `rhythm` | 累计旅行天数达到 30 天 |
| `monthly-streak` | 连续脚步 | `rhythm` | 连续 3 个月有旅行记录 |
| `shared-memory` | 同行记忆 | `companion` | 与 2 位以上旅伴留下记录 |
| `guide-planner` | 攻略派 | `content` | 关联或收藏攻略达到 5 篇 |
| `photo-keeper` | 摄影记录者 | `content` | 旅行照片达到 20 张 |
| `citywalk-lover` | 城市漫游家 | `style` | `citywalk` 标签达到 3 条 |
| `rail-flight-traveler` | 铁道/飞行偏好 | `style` | 火车或飞机交通记录达到 3 条 |

### 3.2 连续年度成就 / Streak Achievements

- `streak-consecutive-years-2`：连续 2 年都有旅行记录，`group = streak`，`periodType = streak`，`rarity = epic`。
- `streak-consecutive-years-3`：连续 3 年都有旅行记录，`group = streak`，`periodType = streak`，`rarity = legendary`。

- `streak-consecutive-years-2`: 2 consecutive active travel years, with `group = streak`, `periodType = streak`, and `rarity = epic`.
- `streak-consecutive-years-3`: 3 consecutive active travel years, with `group = streak`, `periodType = streak`, and `rarity = legendary`.

`GET /api/stats/annual-review?year=YYYY` 当前返回 6 个年度限定成就，全部使用 `group = annual`、`periodType = annual`、`rarity = rare`。

`GET /api/stats/annual-review?year=YYYY` currently returns 6 annual-limited achievements, all with `group = annual`, `periodType = annual`, and `rarity = rare`.

- `annual-${year}-travel-days`：这一年旅行天数达到 20 天。
- `annual-${year}-photo-keeper`：这一年旅行照片达到 30 张。
- `annual-${year}-shared-memory`：这一年与 2 位以上旅伴同行。
- `annual-${year}-country-collector`：这一年覆盖 2 个国际国家或地区。
- `annual-${year}-long-trip`：这一年最长行程达到 5 天。
- `annual-${year}-citywalk-lover`：这一年 `citywalk` 标签达到 3 条。

- `annual-${year}-travel-days`: 20 travel days within the selected year.
- `annual-${year}-photo-keeper`: 30 travel photos within the selected year.
- `annual-${year}-shared-memory`: 2 or more companions within the selected year.
- `annual-${year}-country-collector`: 2 international countries or regions within the selected year.
- `annual-${year}-long-trip`: a 5-day longest trip within the selected year.
- `annual-${year}-citywalk-lover`: 3 `citywalk` markers within the selected year.

## 4. 计算规则 / Computation Rules

聚合逻辑集中在 `server/appApi/services/stats/aggregator.ts`，保持无 Prisma / I/O 副作用。

Aggregation lives in `server/appApi/services/stats/aggregator.ts` and remains Prisma / I/O free.

核心函数：

Core functions:

- `buildAchievements()`：生成 12 个账号级成就，并在末尾拼接 `buildStreakAchievements()` 的结果。
- `buildStreakAchievements()`：基于最长连续年份链路生成 2 个 streak 成就，并附带 `streakYears`。
- `buildAnnualAchievements()`：按年份生成 6 个年度限定成就。
- `getAchievementRarity()`：根据周期和目标自动派生稀有度。
- `getAchievementNextHint()`：为未达成成就生成下一步提示。

- `buildAchievements()`: creates the 12 account-level achievements and appends the result of `buildStreakAchievements()`.
- `buildStreakAchievements()`: builds the 2 streak achievements from the longest consecutive-year chain and attaches `streakYears`.
- `buildAnnualAchievements()`: creates the 6 annual-limited achievements for a given year.
- `getAchievementRarity()`: derives rarity from period type and target shape.
- `getAchievementNextHint()`: generates the next-step hint for non-unlocked achievements.

`/stats` 的成就是基于筛选后的 markers / trips / guides 实时计算，因此年份、范围、旅伴、行程、标签、心情、天气、交通和预算筛选都会影响账号级与 streak 成就状态。

`/stats` achievements are recomputed from the filtered markers / trips / guides, so year, scope, companion, trip, tag, mood, weather, transport, and budget filters all affect account-level and streak status.

## 5. 持久化语义 / Persistence Semantics

首次解锁时间单独存入 `AchievementUnlock`，数据库表为 `achievement_unlocks`，唯一约束为：

First-unlock timestamps are persisted in `AchievementUnlock` (`achievement_unlocks`) with the unique key:

```text
account_id + achievement_id + period_key
```

`period_key` 当前有 3 种语义：

`period_key` currently has 3 meanings:

- `global`：默认全量统计视图下的账号级成就。
- `streak`：默认全量统计视图下的连续年度成就。
- `annual:${year}`：年度回顾中的年度限定成就。

- `global`: account-level achievements from the default all-data overview.
- `streak`: consecutive-year achievements from the default all-data overview.
- `annual:${year}`: annual-limited achievements from a specific annual review.

只有默认全量 `/stats` 视图会写入 `global` 和 `streak` 首次解锁时间；任意筛选态 `/stats` 只做实时计算，不写数据库。年度回顾始终写入对应的 `annual:${year}`。

Only the default all-data `/stats` view writes first-unlock timestamps for `global` and `streak`; filtered `/stats` views are computed live and never persisted. Annual reviews always write the corresponding `annual:${year}` period.

## 6. 前端展示 / Frontend Display

统计中心在摘要卡片后展示成就区块，默认展示 6 个重点卡片，并提供“查看成就总览”入口跳转到 `/achievements`。

The stats center renders an achievement section after the summary cards, shows 6 spotlight cards by default, and provides a "view achievement atlas" entry that navigates to `/achievements`.

成就卡片与详情弹窗已抽为共享 UI，供 `/stats` 和 `/achievements` 复用。卡片可展示：

Achievement cards and the detail dialog are shared UI reused by both `/stats` and `/achievements`. Cards can show:

- 稀有度徽标。
- 周期标签。
- 进度条与进度文案。
- 未达成时的 `nextHint`。

- rarity badges.
- period labels.
- progress bars and progress copy.
- `nextHint` for non-unlocked achievements.

`/yearbook/:year` 在高光区域后展示 6 个年度成就，也显示稀有度和 `nextHint`，并提供“查看全部成就”入口。

`/yearbook/:year` renders 6 annual achievements after the highlight section, also shows rarity and `nextHint`, and includes a "view all achievements" entry.

`/achievements` 独立页会：

The standalone `/achievements` page:

- 先请求 `fetchStatsOverview({ scope: 'all' })`。
- 再按 `availableYears` 并发请求所有年度回顾。
- 用 `FancySelect` 按分组、稀有度和状态筛选。
- 以 summary + group panel 形式统一浏览账号级、streak 与年度成就。

- first fetch `fetchStatsOverview({ scope: 'all' })`.
- then fetch all annual reviews in parallel from `availableYears`.
- use `FancySelect` to filter by group, rarity, and status.
- present account-level, streak, and annual achievements through summary cards and group panels.

## 7. 分享卡与交互反馈 / Share Cards and Feedback

成就详情弹窗集成私有分享卡导出能力，核心实现位于 `src/modules/achievements/achievementShareCard.ts` 和 `src/modules/achievements/useAchievementShareCard.ts`。

Achievement detail integrates private share-card export through `src/modules/achievements/achievementShareCard.ts` and `src/modules/achievements/useAchievementShareCard.ts`.

当前规则：

Current rules:

- `locked` 成就不导出，只通过全局 `AppToast` 提示当前尚未解锁。
- `close` 和 `unlocked` 成就都可导出 SVG 分享卡。
- 导出文件名按成就 ID 派生，内容会带成就标题、状态、证据和账号名。
- 所有即时反馈统一走 `AppToast`，不在卡片局部塞隐性文案。

- `locked` achievements do not export and instead show a global `AppToast` hint.
- both `close` and `unlocked` achievements can export SVG share cards.
- filenames are derived from the achievement ID, and the card includes the title, status, evidence, and account name.
- all immediate feedback goes through the global `AppToast` instead of subtle local copy.

## 8. 弹窗与滚动约束 / Dialog and Scroll Rules

成就详情使用通用 `Dialog`。弹窗打开期间会锁定 `document.body` 滚动，并通过 `overscroll-behavior: contain` 阻止内部滚动穿透到背景页面。

Achievement detail uses the shared `Dialog`. While open, it locks `document.body` scrolling and uses `overscroll-behavior: contain` to prevent inner scrolling from leaking into the background page.

后续任何可滚动成就扩展弹窗都应复用 `src/components/ui/Dialog.tsx`，不要在业务组件里重复实现 body lock。

Any future scrollable achievement-related dialogs should reuse `src/components/ui/Dialog.tsx` instead of reimplementing body locking in business components.

## 9. 验证范围 / Validation

当前测试覆盖：

Current automated coverage includes:

- 服务端聚合：账号级、streak、年度成就的进度、稀有度、`nextHint` 和持久化 period key。
- API 契约：`GET /api/stats/overview` 和 `GET /api/stats/annual-review` 的 achievement 字段完整性。
- 前端页面：`/stats`、`/yearbook/:year`、`/achievements` 的展示、筛选、导航和空态。
- 分享能力：分享卡 SVG 生成、下载逻辑和 Toast 行为。
- 路由与宿主：`/achievements` 路由接入和页面分发。

- backend aggregation: account-level, streak, and annual progress, rarity, `nextHint`, and persistence period keys.
- API contracts: achievement field completeness for `GET /api/stats/overview` and `GET /api/stats/annual-review`.
- frontend pages: rendering, filtering, navigation, and empty states for `/stats`, `/yearbook/:year`, and `/achievements`.
- share behavior: SVG generation, download flow, and Toast feedback.
- routing and host integration: `/achievements` routing and top-level app dispatch.
