# MySQL 升级技术方案

## 文档目标

这份文档用于把 roadmap 中“数据库升级到 MySQL”这件事收敛成可直接开发的技术方案。

本文默认前提：

- 项目尚未正式上线
- 不考虑历史线上数据迁移
- 可以直接调整当前本地优先的数据架构
- 后续开发默认以本文档作为执行清单

## 背景

当前项目的主数据仍然以浏览器本地存储为主：

- 旅行数据主状态聚合在 `TravelStore`
- 页面启动时从 `IndexedDB` / `localStorage` 加载
- 页面内修改后再整包回写本地存储
- 服务端目前只有攻略搜索 API，没有业务主数据库

这套结构适合原型阶段，但会限制后续能力：

- 无法自然支持账号体系
- 无法支持跨设备同步
- 无法支持服务端统计与搜索
- 无法支持分享页和发布态数据源
- 后续 `Trip`、标签、全文搜索等功能没有稳定的数据底座

因此，本次升级的本质不是“替换一个存储驱动”，而是把应用从“前端本地存储应用”升级成“服务端 MySQL 主数据应用”。

## 本期目标

### 目标

- 引入 MySQL 作为业务主数据库
- 新增服务端业务 API，承接旅行主数据读写
- 让前端默认从服务端加载并提交主数据
- 保持当前页面交互形态尽量不变
- 为后续 `Trip Collection`、全文搜索、统计中心、标签系统预留扩展位

### 非目标

- 不处理历史线上数据迁移
- 不实现真正的账号登录系统
- 不实现多端实时同步
- 不实现复杂离线冲突合并
- 不把攻略抓取缓存一起迁到 MySQL
- 不在本期完成 `Trip`、标签、全文搜索等后续功能

## 结论先行

本期方案采用以下原则：

1. `MySQL` 成为主数据源
2. `TravelStore` 继续保留，但降级为前端聚合态模型
3. 前端不再依赖 `store` 整包落本地，而是通过 API 按领域对象读写
4. 先新增独立业务 API 服务，不把所有新逻辑继续堆到当前攻略 API 中
5. 本地 `IndexedDB` 在本期不再作为主持久化，只保留攻略缓存用途
6. 数据导出能力保留，数据导入能力延后到未来有明确云端合并策略时再做

## 技术选型

## 服务端栈

- Node.js 20+
- TypeScript
- Fastify
- Prisma
- MySQL 8.0
- Zod
- Vitest

## 选型理由

- `Fastify` 适合快速搭建结构清晰的 JSON API，性能和插件生态都足够
- `Prisma` 可以降低表结构、类型和查询维护成本，适合当前项目规模
- `MySQL 8.0` 作为主数据层足够稳定，也符合 roadmap 目标
- `Zod` 用于服务端输入校验，避免接口进入脏数据

## 目录规划

建议新增服务端业务目录，和当前攻略搜索服务并行存在：

```text
server/
├─ appApi/
│  ├─ routes/
│  ├─ services/
│  ├─ repositories/
│  ├─ schemas/
│  ├─ serializers/
│  ├─ errors/
│  └─ utils/
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ appApiServer.ts
├─ guideApiServer.mjs
└─ ...
```

说明：

- `guideApiServer.mjs` 继续负责攻略搜索与正文抓取
- `appApiServer.ts` 负责旅行主数据 API
- 两个服务可以在本地并行运行，也可以在后续合并到统一入口

## 数据模型设计

## 当前前端聚合模型

当前前端核心状态为：

```ts
interface TravelStore {
  users: UserProfile[];
  markers: VisitMarker[];
  activeUserId: string;
  savedGuides: SavedGuide[];
  guideSearchHistory: GuideSearchHistoryItem[];
}
```

这个结构适合作为页面聚合态，但不适合直接映射成单表存储。

## 服务端领域对象

本期拆成以下核心实体：

- `account`
- `travel_companion`
- `visit_marker`
- `visit_marker_image`
- `saved_guide`
- `guide_search_history`

说明：

- 当前前端里的 `users` 本质上不是登录账号，而是“旅伴身份”
- 因此服务端必须区分“系统账户”和“旅伴对象”
- 虽然本期不做登录，但从表结构层就要把这层关系预留好

## 表结构

### `accounts`

用于表示应用拥有者。首版先支持单账户模式。

字段建议：

- `id`
- `name`
- `created_at`
- `updated_at`

说明：

- 首版可以由启动脚本或 seed 自动创建一个默认账户
- 后续登录系统接入后再把真实用户绑定到这里

### `travel_companions`

对应当前前端 `TravelStore.users`。

字段建议：

- `id`
- `account_id`
- `name`
- `color`
- `sort_order`
- `created_at`
- `updated_at`
- `deleted_at`

约束建议：

- 主键：`id`
- 索引：`account_id`
- 唯一约束：`account_id + name + deleted_at`

### `visit_markers`

对应当前前端 `TravelStore.markers`。

字段建议：

- `id`
- `account_id`
- `companion_id`
- `scope`
- `scope_id`
- `scope_name`
- `city`
- `note`
- `visited_start_at`
- `visited_end_at`
- `created_at`
- `updated_at`
- `deleted_at`

约束建议：

- 主键：`id`
- 索引：`account_id`
- 索引：`companion_id`
- 索引：`scope + scope_id`
- 索引：`visited_start_at`

### `visit_marker_images`

把图片从 `visit_markers.imageUrls` 中拆出来。

字段建议：

- `id`
- `marker_id`
- `image_url`
- `sort_order`
- `created_at`

约束建议：

- 主键：`id`
- 索引：`marker_id`
- 唯一约束：`marker_id + sort_order`

### `saved_guides`

对应当前前端 `TravelStore.savedGuides`。

字段建议：

- `id`
- `account_id`
- `saved_by_companion_id`
- `marker_id`，可空
- `keyword`
- `guide_identity`
- `guide_title`
- `guide_summary`
- `guide_source_name`
- `guide_source_url`
- `guide_cover_image_url`，可空
- `guide_author_name`，可空
- `guide_published_at`，可空
- `guide_destination_label`，可空
- `guide_payload_json`
- `saved_at`
- `deleted_at`

说明：

- `marker_id` 为空表示普通收藏
- `marker_id` 非空表示关联到旅行记录
- `guide_payload_json` 用于保留当前前端 `GuideSearchResult | GuideDocument` 的原始快照
- `guide_identity` 建议使用标准化后的 `sourceUrl`

约束建议：

- 主键：`id`
- 索引：`account_id`
- 索引：`saved_by_companion_id`
- 索引：`marker_id`
- 唯一约束：`saved_by_companion_id + marker_id + guide_identity + deleted_at`

补充说明：

- 这里的唯一约束需要结合 `marker_id` 为空的情况实现
- 如果 Prisma 和 MySQL 在空值唯一约束上不够直观，建议增加一个持久化字段 `save_context_key`
- 规则如下：
  - 普通收藏：`favorite`
  - 记录关联：`marker:{marker_id}`
- 最终唯一约束可改为：`saved_by_companion_id + save_context_key + guide_identity + deleted_at`

### `guide_search_histories`

对应当前前端 `TravelStore.guideSearchHistory`。

字段建议：

- `id`
- `account_id`
- `companion_id`
- `keyword`
- `keyword_normalized`
- `scope`
- `created_at`
- `deleted_at`

约束建议：

- 主键：`id`
- 索引：`account_id`
- 索引：`companion_id`
- 唯一约束：`companion_id + keyword_normalized + scope + deleted_at`

## ID 策略

本期统一采用字符串 ID。

建议：

- 服务端新生成 ID 使用 `ULID`
- 接口层允许前端不传 ID
- 服务端统一负责分配 ID

理由：

- 兼容现有字符串类型模型
- 时间有序，方便调试与排序
- 后续扩展表时一致性更好

## 时间字段策略

统一约定：

- 所有时间字段使用 UTC ISO 字符串语义
- 数据库存储使用 `datetime(3)` 或 Prisma 对应 `DateTime`
- API 序列化为 ISO 字符串

本期关键时间字段含义：

- `created_at`：数据首次创建时间
- `updated_at`：最后一次修改时间
- `deleted_at`：软删除时间
- `saved_at`：攻略收藏或关联时间
- `visited_start_at` / `visited_end_at`：旅行发生时间

## 删除策略

本期统一使用软删除。

原因：

- 后续账号体系和同步能力会依赖删除痕迹
- 方便后续审计与恢复
- 有利于避免误删导致的脏状态

前端体验上仍表现为“删除后不再显示”。

## 前后端职责划分

## 前端

前端继续负责：

- 页面状态和交互
- 表单收集与即时反馈
- 详情面板、时间线、地图联动
- 攻略搜索界面及阅读体验

前端不再负责：

- 主数据持久化
- 主业务去重规则最终裁决
- 长期主数据存储

## 服务端

服务端新增负责：

- 主数据增删改查
- 业务校验
- 去重约束
- 软删除策略
- 聚合返回前端 `TravelStore` 所需数据

## API 设计

## 设计原则

- 首版优先保证前端平滑接入
- 先提供聚合读取接口，降低前端改造成本
- 写接口按领域对象拆分，避免继续走整包提交
- 接口返回结构尽量贴近当前前端模型

## 聚合读取接口

### `GET /api/app/bootstrap`

用途：

- 页面初始化加载所有主数据
- 替代当前前端 `loadPersistedStore()`

成功响应示例：

```json
{
  "store": {
    "users": [],
    "markers": [],
    "activeUserId": "companion_01",
    "savedGuides": [],
    "guideSearchHistory": []
  },
  "meta": {
    "accountId": "acct_01",
    "fetchedAt": "2026-04-22T00:00:00.000Z"
  }
}
```

当前状态：

- `PR-2` 已落地该接口的首版骨架
- 当前实现会自动确保默认账户和默认旅伴存在
- 当前返回空数组或默认旅伴数据，后续写接口完成后会逐步承接真实业务数据

说明：

- `users` 对应 `travel_companions`
- `markers` 由 `visit_markers + visit_marker_images` 组装
- `savedGuides` 由 `saved_guides` 反序列化生成
- `guideSearchHistory` 按时间倒序返回
- `activeUserId` 首版可由服务端返回默认旅伴 ID

## 旅伴接口

### `POST /api/companions`

用途：

- 新增旅伴

请求体：

```json
{
  "name": "小雨",
  "color": "#6a5acd"
}
```

### `PATCH /api/companions/:id`

用途：

- 修改旅伴名称或颜色

## 旅行记录接口

### `POST /api/markers`

用途：

- 新增旅行记录

请求体：

```json
{
  "companionId": "companion_01",
  "scope": "international",
  "scopeId": "jp-kyoto",
  "scopeName": "京都府",
  "city": "京都",
  "note": "春天赏樱",
  "imageUrls": ["https://example.com/1.jpg"],
  "visitedStartAt": "2026-04-01",
  "visitedEndAt": "2026-04-05"
}
```

### `PATCH /api/markers/:id`

用途：

- 修改旅行记录内容

首版支持：

- `note`
- `imageUrls`
- `visitedStartAt`
- `visitedEndAt`

### `DELETE /api/markers/:id`

用途：

- 软删除旅行记录

行为要求：

- 同时软删除该记录下的攻略关联数据
- 不影响同一攻略在“我的收藏”中的独立记录

## 攻略收藏与关联接口

### `GET /api/saved-guides`

用途：

- 获取当前账户下的收藏和关联数据

支持参数：

- `companionId`
- `markerId`

### `POST /api/saved-guides`

用途：

- 收藏攻略或关联到记录

请求体：

```json
{
  "savedByCompanionId": "companion_01",
  "markerId": "marker_01",
  "keyword": "京都",
  "result": {
    "id": "guide_01",
    "title": "京都三日路线",
    "summary": "适合第一次去京都。",
    "sourceName": "示例来源",
    "sourceUrl": "https://example.com/guide/kyoto"
  }
}
```

行为规则：

- 同一旅伴对同一来源 URL 的普通收藏只能存在一条
- 同一旅伴将同一来源 URL 关联到同一条记录时只能存在一条
- 收藏和关联是两种不同语义，不互相覆盖

### `DELETE /api/saved-guides/:id`

用途：

- 删除收藏或解除关联

## 搜索历史接口

### `GET /api/guide-search-histories`

用途：

- 获取当前旅伴的搜索历史

### `POST /api/guide-search-histories`

用途：

- 写入搜索历史

请求体：

```json
{
  "companionId": "companion_01",
  "keyword": "京都",
  "scope": "international"
}
```

行为规则：

- 同一旅伴的同关键词同范围只保留一条最近记录

## 前端改造方案

## 改造目标

- 不改现有页面结构
- 尽量不动视觉与交互
- 先替换数据加载和写入路径

## 需要调整的模块

### `src/lib/storage.ts`

调整方向：

- 不再承担主数据持久化实现
- 只保留：
  - `createDefaultStore`
  - `createUser`
  - `createMarker`
  - 数据导出辅助
  - 现有 import preview 逻辑中可复用的纯函数

建议新增职责：

- 从“存储实现”转为“前端 store 组装和工具函数”

### 新增 `src/lib/api/`

建议新增：

- `appBootstrapApi.ts`
- `companionsApi.ts`
- `markersApi.ts`
- `savedGuidesApi.ts`
- `guideSearchHistoryApi.ts`

职责：

- 统一封装服务端 API 调用
- 统一处理错误格式
- 返回贴近前端现有模型的数据结构

### 新增 `src/lib/repositories/remoteTravelStoreRepository.ts`

职责：

- 组合多个 API 调用
- 屏蔽前端页面层对接口细节的感知
- 为未来测试替换和 mock 提供稳定边界

### `src/modules/App.tsx`

改造点：

- 启动时调用远端 `bootstrap`
- 移除当前“store 每次变更后整包持久化”的逻辑
- 保留页面局部状态和 UI 组合职责

### `src/modules/app/useTravelStoreActions.ts`

改造点：

- 当前实现是先改内存 store
- 改造后应优先调用远端写接口，再更新前端 store

建议顺序：

1. 新增旅伴
2. 新增记录
3. 删除记录
4. 更新记录
5. 收藏攻略
6. 关联攻略
7. 删除收藏或关联

### `src/components/DataSync.tsx`

本期处理建议：

- 保留“导出当前数据”为 JSON 的能力
- 暂停“导入并合并”的主入口
- UI 上明确标注：云端版暂不支持本地 JSON 回灌

原因：

- 既然项目尚未上线，本期无需优先处理历史数据导入
- 先把主链路收敛到 MySQL，避免为迁移逻辑分散精力

## 服务端实现方案

## 分层

建议服务端按以下分层：

- `routes`：定义 HTTP 路由和请求响应
- `schemas`：定义 Zod 请求校验
- `services`：承接业务规则
- `repositories`：封装 Prisma 查询
- `serializers`：把数据库模型转换为前端需要的数据结构
- `errors`：统一业务错误

## 启动方式

建议在 `package.json` 中增加：

```json
{
  "scripts": {
    "dev:app-api": "tsx watch server/appApiServer.ts",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  }
}
```

同时补充：

- `docker-compose.yml`
- `.env.local` 中的 `DATABASE_URL`

## 环境变量

建议新增：

```bash
DATABASE_URL="mysql://root:password@127.0.0.1:3306/personal_travel_daily"
APP_API_HOST=0.0.0.0
APP_API_PORT=8788
VITE_APP_API_BASE_URL=/api/app
```

说明：

- `GUIDE_API_PORT` 和攻略搜索服务继续保留
- 前端后续同时访问攻略 API 和主业务 API

## Prisma 模型草案

下面给出首版 Prisma 模型草案，开发时可以据此落盘。

```prisma
model Account {
  id          String             @id @default(cuid())
  name        String
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  companions  TravelCompanion[]
  markers     VisitMarker[]
  savedGuides SavedGuide[]
  histories   GuideSearchHistory[]
}

model TravelCompanion {
  id         String      @id @default(cuid())
  accountId  String
  name       String
  color      String
  sortOrder  Int         @default(0)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  deletedAt  DateTime?
  account    Account     @relation(fields: [accountId], references: [id])
  markers    VisitMarker[]
  guides     SavedGuide[]
  histories  GuideSearchHistory[]

  @@index([accountId])
}

model VisitMarker {
  id             String             @id @default(cuid())
  accountId      String
  companionId    String
  scope          String
  scopeId        String
  scopeName      String
  city           String
  note           String             @db.Text
  visitedStartAt DateTime
  visitedEndAt   DateTime
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
  deletedAt      DateTime?
  account        Account            @relation(fields: [accountId], references: [id])
  companion      TravelCompanion    @relation(fields: [companionId], references: [id])
  images         VisitMarkerImage[]
  savedGuides    SavedGuide[]

  @@index([accountId])
  @@index([companionId])
  @@index([scope, scopeId])
  @@index([visitedStartAt])
}

model VisitMarkerImage {
  id        String     @id @default(cuid())
  markerId  String
  imageUrl  String
  sortOrder Int
  createdAt DateTime   @default(now())
  marker    VisitMarker @relation(fields: [markerId], references: [id])

  @@index([markerId])
  @@unique([markerId, sortOrder])
}

model SavedGuide {
  id                    String           @id @default(cuid())
  accountId             String
  savedByCompanionId    String
  markerId              String?
  saveContextKey        String
  keyword               String
  guideIdentity         String
  guideTitle            String
  guideSummary          String           @db.Text
  guideSourceName       String
  guideSourceUrl        String
  guideCoverImageUrl    String?
  guideAuthorName       String?
  guidePublishedAt      DateTime?
  guideDestinationLabel String?
  guidePayloadJson      Json
  savedAt               DateTime
  deletedAt             DateTime?
  account               Account          @relation(fields: [accountId], references: [id])
  companion             TravelCompanion  @relation(fields: [savedByCompanionId], references: [id])
  marker                VisitMarker?     @relation(fields: [markerId], references: [id])

  @@index([accountId])
  @@index([savedByCompanionId])
  @@index([markerId])
  @@unique([savedByCompanionId, saveContextKey, guideIdentity, deletedAt])
}

model GuideSearchHistory {
  id                String           @id @default(cuid())
  accountId         String
  companionId       String
  keyword           String
  keywordNormalized String
  scope             String
  createdAt         DateTime         @default(now())
  deletedAt         DateTime?
  account           Account          @relation(fields: [accountId], references: [id])
  companion         TravelCompanion  @relation(fields: [companionId], references: [id])

  @@index([accountId])
  @@index([companionId])
  @@unique([companionId, keywordNormalized, scope, deletedAt])
}
```

注意：

- 上述 `@default(cuid())` 是占位方案
- 正式实现时建议替换为统一的 `ULID` 生成器

## 开发阶段划分

## Phase 1：服务端基础设施

目标：

- 建立独立业务 API 服务
- 跑通 MySQL、本地开发和 Prisma

交付物：

- `server/appApiServer.ts`
- `server/prisma/schema.prisma`
- `docker-compose.yml`
- 新的环境变量说明
- 健康检查接口

## Phase 2：主数据表与基础读接口

目标：

- 完成核心表落地
- 提供 `bootstrap` 聚合读取接口

交付物：

- Prisma migrations
- `GET /api/app/bootstrap`
- `TravelStore` 聚合序列化器

## Phase 3：旅伴与记录写接口

目标：

- 打通旅伴和旅行记录主链路

交付物：

- `POST /api/companions`
- `PATCH /api/companions/:id`
- `POST /api/markers`
- `PATCH /api/markers/:id`
- `DELETE /api/markers/:id`

## Phase 4：攻略收藏与搜索历史接口

目标：

- 完成 `savedGuides` 和 `guideSearchHistory` 服务端化

交付物：

- `GET /api/saved-guides`
- `POST /api/saved-guides`
- `DELETE /api/saved-guides/:id`
- `GET /api/guide-search-histories`
- `POST /api/guide-search-histories`

## Phase 5：前端切换到远端主数据

目标：

- 页面默认从服务端加载和写入

交付物：

- 新增 `src/lib/api/*`
- 新增远端 repository
- `App.tsx` 切换 `bootstrap`
- `useTravelStoreActions.ts` 切换远端写入

## Phase 6：本地数据功能收口

目标：

- 调整当前 `DataSync` 能力边界

交付物：

- 保留导出
- 暂停导入
- 明确 UI 提示和文档说明

## 开发清单

以下清单默认按执行顺序排列，后续开发直接按此列表推进。

### A. 基础设施

- [x] 选定服务端运行方式：独立 `Fastify` 服务
- [x] 安装依赖：`fastify`、`prisma`、`@prisma/client`、`zod`、`tsx`
- [x] 新增 `server/prisma/schema.prisma`
- [x] 新增 `server/appApiServer.ts`
- [x] 新增 `docker-compose.yml` 并启动本地 MySQL 8
- [x] 新增 `DATABASE_URL`、`APP_API_HOST`、`APP_API_PORT`
- [x] 在 `package.json` 中补充 `dev:app-api`、`db:migrate`、`db:generate`

### B. 数据层

- [x] 创建 `accounts` 表
- [x] 创建 `travel_companions` 表
- [x] 创建 `visit_markers` 表
- [x] 创建 `visit_marker_images` 表
- [x] 创建 `saved_guides` 表
- [x] 创建 `guide_search_histories` 表
- [x] 补齐主键、索引、唯一约束、软删除字段
- [x] 编写默认账户 seed

### C. 服务端基础能力

- [x] 建立统一错误格式
- [x] 建立请求参数校验层
- [x] 建立 Prisma repository 层
- [x] 建立 serializer 层，把数据库模型转为前端 `TravelStore`
- [x] 完成 `GET /api/app/bootstrap`
- [x] 增加 `GET /health` 或 `/api/app/health`

### D. 旅伴接口

- [x] 实现 `POST /api/companions`
- [x] 实现 `PATCH /api/companions/:id`
- [x] 补充旅伴名称和颜色校验
- [x] 明确当前版本暂不开放旅伴删除接口，删除后不可操作约束后移到后续归档能力

### E. 旅行记录接口

- [x] 实现 `POST /api/markers`
- [x] 实现 `PATCH /api/markers/:id`
- [x] 实现 `DELETE /api/markers/:id`
- [x] 实现图片数组和 `visit_marker_images` 的映射
- [x] 实现记录删除后级联软删除关联攻略
- [x] 补充记录归属校验

### F. 攻略收藏与关联接口

- [x] 实现 `GET /api/saved-guides`
- [x] 实现 `POST /api/saved-guides`
- [x] 实现 `DELETE /api/saved-guides/:id`
- [x] 实现 `save_context_key` 规则
- [x] 实现“收藏”和“关联”双语义去重
- [x] 补充记录不存在时禁止关联的校验

### G. 搜索历史接口

- [x] 实现 `GET /api/guide-search-histories`
- [x] 实现 `POST /api/guide-search-histories`
- [x] 实现关键词标准化
- [x] 实现同关键词同范围覆盖旧记录

### H. 前端接入

- [x] 新增 `src/lib/api/httpClient.ts`
- [x] 新增 `src/lib/api/appBootstrapApi.ts`
- [x] 新增 `src/lib/api/companionsApi.ts`
- [x] 新增 `src/lib/api/markersApi.ts`
- [x] 新增 `src/lib/api/savedGuidesApi.ts`
- [x] 新增 `src/lib/api/guideSearchHistoryApi.ts`
- [x] 新增 `src/lib/repositories/remoteTravelStoreRepository.ts`
- [x] 将 `App.tsx` 初始化逻辑切到 `bootstrap`
- [x] 移除 `App.tsx` 中的整包本地持久化副作用
- [x] 将 `useTravelStoreActions.ts` 改造成远端写入 + 本地状态回填

### I. 本地能力收口

- [x] 保留 `DataSync` 导出能力
- [x] 暂停 `DataSync` 导入入口
- [x] 调整文案，说明当前版本以服务端数据为准
- [x] 明确攻略缓存仍走现有本地缓存仓库

### J. 测试

- [x] 为 Prisma repository 补单测或集成测试
- [x] 为 `bootstrap` 接口补集成测试
- [x] 为旅伴接口补测试
- [x] 为记录 CRUD 接口补测试
- [x] 为攻略收藏与关联接口补测试
- [x] 为搜索历史接口补测试
- [x] 为前端 API client 补测试
- [x] 为 `App.tsx` 加载与关键动作链路补回归测试

### K. 文档与收尾

- [x] 更新 `README.md` 文档索引与启动说明
- [x] 更新 `docs/README.md`
- [x] 增加主业务 API contract 文档
- [x] 增加 `.env.example` 中的 MySQL 相关变量
- [x] 记录本期能力边界与后续待办

## 推荐 PR 拆分

为了降低风险，建议不要一个大 PR 全做完，而是按下面方式提交：

1. `PR-1`: MySQL + Prisma + 服务端基础骨架
2. `PR-2`: 核心表结构 + bootstrap 读取接口
3. `PR-3`: 旅伴与旅行记录写接口
4. `PR-4`: saved guides 与 search history 接口
5. `PR-5`: 前端 API client 与远端 repository 接入
6. `PR-6`: DataSync 收口、测试补齐、文档补齐

## 当前进度

截至目前：

- `PR-1` 已完成：服务端骨架、Prisma、docker-compose、环境变量模板
- `PR-2` 已完成：repository 基础分层、`GET /api/app/bootstrap`
- `PR-3` 已基本完成：`companions` 与 `markers` 写接口、校验、图片映射、级联软删除
- `PR-4` 已基本完成：`savedGuides` 与 `guideSearchHistory` 接口、去重规则、软删除与查询过滤
- `PR-5` 已基本完成：前端 `httpClient`、主业务 API client 与 `remoteTravelStoreRepository`
- `PR-6` 已基本完成：`App.tsx` 远端 `bootstrap` 初始化、动作层远端写入、搜索历史远端回写
- `PR-7` 已基本完成：`DataSync` 收口、云端版文案调整、README / 设计稿 / changelog 补齐
- `PR-8` 已基本完成：app-api 路由级测试、`App.tsx` 远端 bootstrap 回归测试、`GuideSearchPanel` / `DataSync` 关键回归测试
- `PR-9` 已基本完成：主业务 API contract 文档、docs 索引与 README 文档入口补齐
- `PR-10` 已基本完成：前端 API client 测试、记录 CRUD 更细粒度接口测试与构建验证
- `PR-11` 已基本完成：repository 层聚焦测试、环境变量模板补充与迁移文档收尾

剩余主线任务建议按下面顺序推进：

1. `PR-12`：补齐联调脚本、本地环境排查文档与账号安全初始化说明

## 风险点

- 当前前端很多逻辑默认认为数据写入是同步且本地即时成功，切到服务端后需要补错误状态处理
- `savedGuides` 同时承载“收藏”和“关联”两种语义，服务端唯一约束设计必须先定清楚
- `DataSync` 现有实现默认面向本地 JSON 合并，本期需要明确降级而不是半保留半失效
- 两个后端服务并行后，本地开发环境变量和代理配置会比现在复杂

## 本期能力边界

- 当前主业务 API 以默认账户 `acct_default` 为中心，不涉及真实账号体系
- 当前旅伴只支持新增与更新，未开放删除/归档接口
- 当前 Prisma 已引入首份正式 migration 历史，开发默认走 `db:migrate`
- 当前本地 MySQL 可通过 Docker 或 Homebrew 启动，但安全初始化仍需要开发者按本机环境自行执行

## 后续待办

- [x] 增加一键联调脚本，串起 MySQL、`app-api`、`guide-api` 与前端 dev server
- [x] 增加本地环境排查文档，覆盖 `brew services`、端口占用、`DATABASE_URL`、Prisma 连接错误
- [x] 增加 MySQL `root` 安全初始化和本地账号权限收敛说明
- 若后续需要旅伴删除，补归档/重分配记录策略，再开放删除接口

## Migration 工作流

- 当前基线 migration：`server/prisma/migrations/20260422_init/migration.sql`
- 新环境初始化顺序：
  1. `npm run db:generate`
  2. `npm run db:migrate`
  3. `npm run db:seed`
- 已存在的本地数据库应先确认 migration 状态：
  - `npm run db:migrate:status`
- `db:push` 仅保留给快速实验场景，不再作为默认主流程

## PR-12 交付

- 新增 `scripts/start-local-dev.sh`
- 新增 `scripts/stop-local-dev.sh`
- 新增 `docs/local-dev-troubleshooting.md`
- 更新 `package.json` 增加 `dev:all` / `dev:stop`
- 更新 `README.md` 与 `docs/README.md` 的入口说明

截至目前：

- `PR-12` 已基本完成：一键联调脚本、本地环境排查文档与 MySQL 安全初始化说明

剩余主线任务建议按下面顺序推进：

1. `PR-13`：联调脚本在 Windows 侧补齐 app-api / MySQL 引导，并完善代理与多端口说明

## 验收标准

- 本地可以一键启动 MySQL 和主业务 API
- 前端启动后默认从服务端读取 `TravelStore`
- 新增旅伴、新增记录、更新记录、删除记录都能持久保存
- 收藏攻略、关联攻略、移除攻略都能持久保存
- 搜索历史能够跨刷新保留
- 导出功能可导出当前聚合后的前端数据
- 应用内不再暴露本地 JSON 导入恢复入口
- 当前攻略搜索 API 能继续正常工作

## 后续扩展位

本期完成后，可直接继续推进：

- `Trip Collection`
- 标签系统
- 服务端统计中心
- 旅行记录全文搜索与筛选
- 云端同步与账号体系

这些能力都不应再重做底层存储，只需在当前 MySQL 主数据模型上扩展。
