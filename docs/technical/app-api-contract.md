# App API Contract

主业务 API 由 `server/appApiServer.ts` 提供，默认监听 `http://0.0.0.0:8788`。

当前版本职责：

- 提供旅行主数据聚合加载能力
- 提供旅伴、行程集合、旅行记录、攻略收藏/关联、搜索历史、trip-bound 行前清单、行前规划工作台，以及愿望地图的服务端读写接口
- 作为前端 `remoteTravelStoreRepository` 的默认数据源

## 当前后端实现对照 / Current Backend Architecture References

本契约文档对应的后端目录结构如下：

- `server/appApi/buildApp.ts`：Fastify 入口、路由注册与统一错误处理
- `server/appApi/routes/*`：HTTP 路由层
- `server/appApi/schemas/*`：`zod` 输入校验
- `server/appApi/services/*`：业务编排与事务边界
- `server/appApi/repositories/*`：Prisma 数据访问
- `server/appApi/serializers/*`：DTO 序列化
- `shared/errors/codes.ts`：前后端共享错误码事实源
- `shared/geo/countryMapping.ts`：统计域复用的国家映射事实源

其中近期已完成的结构刷新包括：

- `visitMarkerRepository` 目录化拆分为 `read / write / batch / search`
- `statsService` 仅保留 I/O 编排，纯聚合下沉到 `services/stats/aggregator.ts`
- `bootstrapSerializer` 拆分为 `serializers/bootstrap/*` 子模块，并保留 barrel 兼容层
- admin 账号级统计摘要下沉到 `services/admin/accountStats.ts`
- 行前规划工作台使用 `routes/trips.ts` 下的 trip 子资源接口，并按 `schemas / services / repositories / serializers` 分层实现
- 愿望地图使用 `routes/wishlist.ts` 独立资源接口，并通过 `TripPlanningItem.sourceWishlistId` 标记导入关系

Summary: The API contract maps directly onto the current backend layering of routes, schemas, services, repositories, serializers, and shared modules.

## 通用约定

### 数据源

- 主数据以 MySQL 为准
- 前端 JSON 导出仅作为人工备份快照
- 应用内不再开放本地 JSON 导入恢复入口

### 响应格式

成功时返回业务 JSON。

失败时统一返回：

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "name is required"
  }
}
```

### 错误码枚举 / Error Code Enum

错误码字面量的事实源位于 `shared/errors/codes.ts`，当前固定枚举如下：

- `INVALID_REQUEST`
- `NOT_FOUND`
- `CONFLICT`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `DATABASE_UNAVAILABLE`
- `INTERNAL_SERVER_ERROR`

常见 HTTP 状态映射：

- `400 -> INVALID_REQUEST`
- `401 -> UNAUTHORIZED`
- `403 -> FORBIDDEN`
- `404 -> NOT_FOUND`
- `409 -> CONFLICT`
- `503 -> DATABASE_UNAVAILABLE`
- `500 -> INTERNAL_SERVER_ERROR`

## 认证接口

### `GET /api/auth/session`

响应示例：

```json
{
  "account": {
    "id": "acct_default",
    "name": "Voyage Atlas",
    "username": "demo",
    "role": "admin"
  }
}
```

规则：

- 未登录时返回 `{ "account": null }`
- `role` 目前有 `admin` 与 `member` 两种

## 健康检查

### `GET /health`

响应示例：

```json
{
  "ok": true,
  "service": "app-api",
  "database": {
    "provider": "mysql",
    "configured": true
  },
  "defaultAccount": {
    "id": "acct_default",
    "name": "Voyage Atlas"
  },
  "timestamp": "2026-04-22T00:00:00.000Z"
}
```

### `GET /api/app/health`

响应示例：

```json
{
  "ok": true,
  "service": "app-api",
  "port": 8788,
  "timestamp": "2026-04-22T00:00:00.000Z"
}
```

## 聚合加载

### `GET /api/app/bootstrap`

用途：

- 前端初始化加载整包 `TravelStore`
- 替代原本的浏览器本地持久化加载入口

响应示例：

```json
{
  "store": {
    "users": [
      {
        "id": "user-alice",
        "name": "小悠",
        "color": "#2563eb"
      }
    ],
    "trips": [
      {
        "id": "trip-2026-spring",
        "name": "2026 江南春游",
        "note": "杭州和苏州周末行",
        "startsAt": "2026-05-01",
        "endsAt": "2026-05-03",
        "createdAt": "2026-04-23T00:00:00.000Z"
      }
    ],
    "markers": [],
    "wishlistItems": [],
    "activeUserId": "user-alice",
    "savedGuides": [],
    "guideSearchHistory": []
  },
  "meta": {
    "accountId": "acct_default",
    "fetchedAt": "2026-04-22T00:00:00.000Z"
  }
}
```

行为说明：

- 若默认账户或默认旅伴不存在，接口会自动兜底创建
- 若数据库不可用，返回 `503 DATABASE_UNAVAILABLE`

## 后台管理接口

### `GET /api/admin/overview`

用途：

- 仅供管理员查看全量系统账号总览
- 按“账号 -> 同行人 -> 旅行记录 / 行前规划 / 收藏攻略 / 攻略搜索历史”，以及“账号 -> 旅行记录搜索行为”返回只读树状数据
- Admin-only overview of all system accounts.
- Returns a read-only tree for "account -> companions -> markers / planning items / saved guides / guide search history", plus account-level marker search behavior.

权限：

- 需要登录
- 当前会话账号必须为 `admin`

成功响应示例：

```json
{
  "accounts": [
    {
      "id": "acct_default",
      "name": "Voyage Atlas",
      "username": "demo",
      "role": "admin",
      "createdAt": "2026-04-22T00:00:00.000Z",
      "companions": [
          {
            "id": "user-alice",
            "name": "小悠",
            "color": "#2563eb",
            "createdAt": "2026-04-22T00:00:00.000Z",
            "markers": [],
            "planningItems": [],
            "savedGuides": [],
            "guideSearchHistory": []
          }
        ],
        "markerSearchEvents": [
          {
            "id": "marker-search-1",
            "companionId": "user-alice",
            "keyword": "京都",
            "scope": "international",
            "year": "2026",
            "resultCount": 3,
            "page": 1,
            "pageSize": 20,
            "createdAt": "2026-04-24T00:00:00.000Z"
          }
        ],
        "stats": {
          "tripCount": 0,
          "companionCount": 1,
          "markerCount": 0,
          "savedGuideCount": 0,
          "guideSearchHistoryCount": 0,
          "markerSearchEventCount": 1,
          "planningItemCount": 0,
          "convertedPlanningItemCount": 0
        }
      }
  ],
  "meta": {
    "fetchedAt": "2026-04-23T00:00:00.000Z",
    "accountCount": 1
  }
}
```

错误：

- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `503 DATABASE_UNAVAILABLE`

## 行程统计中心接口

### `GET /api/stats/overview`

用途：

- 返回当前登录账号在指定筛选条件下的统计中心聚合结果
- 供 `/stats` 统计中心页面使用

权限：

- 需要登录

查询参数：

- `year`：可选，格式 `YYYY`
- `scope`：可选，`all | domestic | international`
- `companionId`：可选，单旅伴筛选
- `tripId`：可选，单行程筛选；传 `unassigned` 表示未归入行程
- `tag`：可选，记录标签枚举值，如 `food | hiking | beach | museum | photography | family | weekend | business | nature | citywalk`
- `mood`：可选，心情枚举值，如 `relaxed | excited | tired | surprised | peaceful`
- `weather`：可选，天气枚举值，如 `sunny | cloudy | rainy | snowy | windy`
- `transport`：可选，交通方式枚举值，如 `walk | car | train | plane | metro | bus`
- `budgetLevel`：可选，预算级别枚举值，如 `low | medium | high`

成功响应示例：

```json
{
  "filters": {
    "year": "all",
    "scope": "all",
    "tag": "citywalk",
    "mood": "relaxed",
    "weather": "sunny",
    "transport": "walk",
    "budgetLevel": "medium"
  },
  "availableYears": ["2026", "2025"],
  "companions": [
    {
      "id": "user-alice",
      "name": "小悠",
      "color": "#2563eb"
    }
  ],
  "trips": [
    {
      "id": "trip-2026-spring",
      "name": "2026 江南春游",
      "startsAt": "2026-05-01",
      "endsAt": "2026-05-03"
    }
  ],
  "summary": {
    "totalTrips": 1,
    "totalMarkers": 2,
    "totalTravelDays": 4,
    "totalCities": 2,
    "totalRegions": 2,
    "totalCountries": 0,
    "activeCompanions": 1,
    "longestTripDays": 4
  },
  "yearlySeries": [
    {
      "year": "2026",
      "markerCount": 2,
      "travelDays": 4
    }
  ],
  "monthlyDistribution": [
    {
      "month": "05",
      "markerCount": 2,
      "travelDays": 4
    }
  ],
  "topRegions": [
    {
      "scopeId": "zj",
      "scopeName": "浙江",
      "scope": "domestic",
      "markerCount": 2
    }
  ],
  "topCities": [
    {
      "city": "杭州",
      "scopeName": "浙江",
      "scope": "domestic",
      "markerCount": 2
    }
  ],
  "companionRanking": [
    {
      "companionId": "user-alice",
      "companionName": "小悠",
      "color": "#2563eb",
      "markerCount": 2,
      "travelDays": 4
    }
  ],
  "tripRanking": [],
  "tripDetails": [],
  "topTags": [
    {
      "value": "citywalk",
      "label": "城市漫游",
      "markerCount": 2
    }
  ],
  "topMoods": [
    {
      "value": "relaxed",
      "label": "放松",
      "markerCount": 2
    }
  ],
  "topWeather": [
    {
      "value": "sunny",
      "label": "晴",
      "markerCount": 2
    }
  ],
  "topTransports": [
    {
      "value": "walk",
      "label": "步行",
      "markerCount": 2
    }
  ],
  "topBudgetLevels": [
    {
      "value": "medium",
      "label": "中预算",
      "markerCount": 2
    }
  ],
  "tripHighlights": {},
  "achievements": [
    {
      "id": "city-explorer",
      "title": "城市探索者",
      "description": "覆盖 5 座不同城市。",
      "category": "footprint",
      "status": "unlocked",
      "progressValue": 5,
      "progressTarget": 5,
      "remainingValue": 0,
      "unit": "座城市",
      "evidence": [
        {
          "label": "杭州",
          "value": "浙江"
        }
      ],
      "firstUnlockedAt": "2026-05-02T14:19:00.000Z"
    }
  ],
  "heatmap": [
    {
      "scopeId": "zj",
      "scopeName": "浙江",
      "scope": "domestic",
      "intensity": 5,
      "markerCount": 2
    }
  ],
  "generatedAt": "2026-05-06T00:00:00.000Z"
}
```

错误：

- `400 INVALID_REQUEST`
- `401 UNAUTHORIZED`
- `404 NOT_FOUND`
- `503 DATABASE_UNAVAILABLE`

成就说明：

- `achievements` 固定返回统计中心旅行成就列表。
- `status` 为 `unlocked | close | locked`，其中 `close` 表示进度达到目标 60% 及以上但尚未达成。
- `evidence` 为成就详情弹窗使用的达成证据，最多返回少量代表项。
- 默认全量统计视图会持久化并返回 `firstUnlockedAt`；带筛选条件的视图实时计算成就，但不写入首次解锁记录。

### `GET /api/stats/annual-review`

用途：

- 返回当前登录账号在指定年份的年度回顾聚合结果
- 供 `/yearbook/:year` 页面使用

权限：

- 需要登录

查询参数：

- `year`：必填，格式 `YYYY`

成功响应核心字段：

```json
{
  "year": "2026",
  "availableYears": ["2026", "2025"],
  "summary": {
    "totalTrips": 3,
    "totalMarkers": 12,
    "totalTravelDays": 21,
    "totalCities": 8,
    "totalRegions": 6,
    "totalCountries": 2,
    "activeCompanions": 2,
    "longestTripDays": 6,
    "photoCount": 34,
    "guideCount": 5
  },
  "monthlyDistribution": [],
  "topRegions": [],
  "topCities": [],
  "companionRanking": [],
  "tripHighlights": {},
  "heatmap": [],
  "photos": [
    {
      "imageId": "image-hangzhou-1",
      "markerId": "marker-1",
      "markerTitle": "浙江 · 杭州",
      "imageUrl": "https://example.com/hangzhou-1.jpg",
      "visitedStartAt": "2026-05-01",
      "scopeName": "浙江",
      "city": "杭州",
      "isFeatured": true,
      "caption": "西湖晚风",
      "curatedSortOrder": 10
    }
  ],
  "guides": [],
  "trips": [],
  "achievements": [
    {
      "id": "annual-2026-travel-days",
      "title": "年度出发王",
      "description": "这一年旅行天数达到 20 天。",
      "category": "rhythm",
      "status": "unlocked",
      "progressValue": 21,
      "progressTarget": 20,
      "remainingValue": 0,
      "unit": "天",
      "evidence": [
        {
          "label": "2026-05",
          "value": "有旅行记录"
        }
      ],
      "firstUnlockedAt": "2026-05-02T14:19:00.000Z"
    }
  ],
  "generatedAt": "2026-05-06T00:00:00.000Z"
}
```

年度成就说明：

- 年度回顾成就只基于该 `year` 内的旅行记录计算。
- 年度成就首次解锁时间按 `annual:${year}` 维度持久化。
- `photos` 使用与行程详情一致的照片精选字段和排序语义；精选照片优先，没有精选时按日期照片流回退。

错误：

- `400 INVALID_REQUEST`
- `401 UNAUTHORIZED`
- `503 DATABASE_UNAVAILABLE`

## 旅伴接口

### `POST /api/companions`

请求体：

```json
{
  "name": "阿泽",
  "color": "#f97316"
}
```

成功响应：

- 返回最新的整包 `TravelStore`

字段规则：

- `name` 必填，长度 `1-20`
- `color` 必填，格式必须为 `#RRGGBB`

错误：

- `400 INVALID_REQUEST`
- `409 CONFLICT`：同一账户下旅伴名重复

## 行程集合接口

### `POST /api/trips`

请求体：

```json
{
  "name": "2026 江南春游",
  "note": "杭州和苏州周末行",
  "startsAt": "2026-05-01",
  "endsAt": "2026-05-03",
  "coverImageUrl": "https://example.com/cover.jpg"
}
```

成功响应：

- 返回最新的整包 `TravelStore`

字段规则：

- `name` 必填，长度 `1-80`
- `note` 可选，最多 `500` 字符
- `startsAt` / `endsAt` 必填，格式为 `YYYY-MM-DD`
- `endsAt` 不能早于 `startsAt`
- `coverImageUrl` 可选，必须是合法 URL

### `PATCH /api/trips/:id`

请求体：

```json
{
  "name": "2026 江南春游（更新）",
  "note": "补充苏州段",
  "startsAt": "2026-05-01",
  "endsAt": "2026-05-04",
  "coverImageUrl": null
}
```

成功响应：

- 返回最新的整包 `TravelStore`

规则：

- 至少提交一个字段
- `coverImageUrl: null` 表示清空封面

### `DELETE /api/trips/:id`

成功响应：

- 返回最新的整包 `TravelStore`

规则：

- 行程软删除
- 已归入该行程的旅行记录会保留，但解除 `tripId`

### `GET /api/trips/:id/detail`

用途：

- 返回当前登录账号下某个行程的只读详情聚合数据
- 供行程详情页、行前清单页和 Story Studio 旅行故事页复用

权限：

- 需要登录

路径参数：

- `id`：行程 ID

成功响应示例：

```json
{
  "trip": {
    "id": "trip-2026-spring",
    "name": "2026 江南春游",
    "note": "杭州和苏州周末行",
    "startsAt": "2026-05-01",
    "endsAt": "2026-05-03",
    "createdAt": "2026-04-20T00:00:00.000Z"
  },
  "summary": {
    "markerCount": 2,
    "travelDays": 3,
    "cityCount": 2,
    "regionCount": 2,
    "companionCount": 1,
    "guideCount": 1,
    "photoCount": 2
  },
  "companions": [
    {
      "id": "user-alice",
      "name": "小悠",
      "color": "#2563eb",
      "markerCount": 2
    }
  ],
  "markers": [
    {
      "id": "marker-1",
      "companionId": "user-alice",
      "companionName": "小悠",
      "companionColor": "#2563eb",
      "scope": "domestic",
      "scopeId": "zj",
      "scopeName": "浙江",
      "city": "杭州",
      "note": "西湖晚风",
      "imageUrls": ["https://example.com/hangzhou-1.jpg"],
      "visitedStartAt": "2026-05-01",
      "visitedEndAt": "2026-05-02"
    }
  ],
  "photos": [
    {
      "imageId": "image-hangzhou-1",
      "markerId": "marker-1",
      "markerTitle": "浙江 · 杭州",
      "imageUrl": "https://example.com/hangzhou-1.jpg",
      "visitedStartAt": "2026-05-01",
      "scopeName": "浙江",
      "city": "杭州",
      "isFeatured": true,
      "caption": "西湖晚风",
      "curatedSortOrder": 10
    }
  ],
  "guides": [
    {
      "id": "saved-guide-1",
      "markerId": "marker-1",
      "keyword": "杭州周末",
      "savedAt": "2026-05-05T00:00:00.000Z",
      "result": {
        "id": "guide-1",
        "title": "杭州周末攻略",
        "summary": "逛西湖、灵隐寺",
        "sourceName": "Qyer",
        "sourceUrl": "https://example.com/guide/1"
      }
    }
  ],
  "planningSummary": {
    "total": 2,
    "plannedCount": 1,
    "convertedCount": 1,
    "highPriorityCount": 1
  },
  "checklistSummary": {
    "total": 3,
    "preDepartureCount": 2,
    "inTransitCount": 1,
    "doneCount": 0
  },
  "checklistGroups": [
    {
      "stage": "pre_departure",
      "title": "出发前准备",
      "description": "把预约、路线、装备和行前确认放在这里。",
      "itemCount": 2,
      "items": []
    }
  ],
  "meta": {
    "generatedAt": "2026-05-06T00:00:00.000Z"
  }
}
```

规则：

- 仅返回当前账号可访问且未软删除的行程
- 行程不存在、已删除或不属于当前账号时统一返回 `404 NOT_FOUND`
- `guides` 会去重同一攻略的重复关联，优先保留最新保存记录
- `photos` 仅包含当前行程记录上的图片
- `photos` 排序为精选优先、人工排序其次、访问日期和记录内原图顺序兜底
- `planningSummary` 只提供行前规划轻量摘要；完整规划列表由 `GET /api/trips/:id/planning` 获取
- `checklistSummary` 与 `checklistGroups` 直接内嵌在详情响应中，供 `/trips/:id` 首屏展示行前清单面板
- `/trips/:id/story` 复用本响应生成私有 Story Studio、浏览器打印 / PDF、动态 SVG 长图、方形 / 竖版分享卡；故事徽章、路线回放海报和分享卡模型均由前端纯函数派生，不新增 story 专用 API

错误：

- `400 INVALID_REQUEST`
- `401 UNAUTHORIZED`
- `404 NOT_FOUND`
- `503 DATABASE_UNAVAILABLE`

### `PATCH /api/trips/:id/photos/curation`

用途：

- 批量更新某个行程内图片的精选状态、说明文字和人工展示顺序
- 供 `/trips/:id` 的“素材”Tab 照片墙使用

权限：

- 需要登录

路径参数：

- `id`：行程 ID

请求体：

```json
{
  "photos": [
    {
      "imageId": "image-hangzhou-1",
      "isFeatured": true,
      "caption": "西湖晚风",
      "curatedSortOrder": 10
    },
    {
      "imageId": "image-suzhou-1",
      "isFeatured": false,
      "caption": null,
      "curatedSortOrder": null
    }
  ]
}
```

成功响应：

- 返回最新的 `GET /api/trips/:id/detail` 聚合结果

规则：

- `photos` 至少 1 项，最多 200 项
- `imageId` 必填
- `isFeatured` 可选，省略则保持当前值
- `caption` 可选，最多 160 字符；`null` 表示清空说明
- `curatedSortOrder` 可选，必须为非负整数；`null` 表示清空人工排序
- 服务端必须校验每张图片都属于当前登录账号，且图片所在旅行记录属于当前行程
- 行程不存在、已删除、不属于当前账号，或图片不属于该行程时返回 `404 NOT_FOUND`
- 该接口只更新图片精选元数据，不改变旅行记录内原始图片顺序，也不处理上传、下载、代理或压缩

错误：

- `400 INVALID_REQUEST`
- `401 UNAUTHORIZED`
- `404 NOT_FOUND`
- `503 DATABASE_UNAVAILABLE`

### `GET /api/trips/:id/planning`

用途：

- 返回某个行程当前的行前规划摘要与规划项列表
- 供 `/trips/:id` 的“行前规划”Tab 局部加载和刷新使用

成功响应示例：

```json
{
  "summary": {
    "total": 2,
    "plannedCount": 1,
    "convertedCount": 1,
    "highPriorityCount": 1
  },
  "items": [
    {
      "id": "planning-1",
      "tripId": "trip-2026-spring",
      "companionId": "user-alice",
      "companionName": "小悠",
      "companionColor": "#2563eb",
      "title": "岚山竹林",
      "scope": "international",
      "scopeId": "japan",
      "scopeName": "日本",
      "city": "京都",
      "note": "清晨去，避开人流",
      "priority": "high",
      "plannedDate": "2026-05-02",
      "status": "planned",
      "sourceGuideTitle": "京都春日路线",
      "sourceGuideSourceName": "示例来源",
      "sourceGuideSourceUrl": "https://example.com/guides/kyoto",
      "sortOrder": 0,
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-05-01T00:00:00.000Z"
    }
  ]
}
```

### `POST /api/trips/:id/planning/items`

请求体：

```json
{
  "companionId": "user-alice",
  "title": "岚山竹林",
  "scope": "international",
  "scopeId": "japan",
  "scopeName": "日本",
  "city": "京都",
  "note": "清晨去，避开人流",
  "priority": "high",
  "plannedDate": "2026-05-02",
  "guide": {
    "identity": "https://example.com/guides/kyoto",
    "title": "京都春日路线",
    "sourceName": "示例来源",
    "sourceUrl": "https://example.com/guides/kyoto"
  }
}
```

规则：

- `companionId` 必须属于当前账号下未删除的同行人
- `priority` 可选，默认 `medium`，取值为 `low | medium | high`
- `plannedDate` 可选，格式为 `YYYY-MM-DD`
- `guide` 可选，仅作为来源元数据保存，不改变 `SavedGuide` 去重规则

### `POST /api/trips/:id/planning/from-wishlist/:wishlistId`

用途：

- 从当前账号下的愿望地图条目复制生成一条行程规划项。
- 原愿望项会保留，作为长期愿望池继续存在。

成功响应：

- 返回创建后的 `TripPlanningItem`

规则：

- `tripId` 必须属于当前账号且未删除。
- `wishlistId` 必须属于当前账号且未删除。
- 服务端复制愿望项的地点、优先级、备注、创建旅伴和来源攻略元数据。

### `GET /api/wishlist`

成功响应示例：

```json
{
  "items": [
    {
      "id": "wishlist-1",
      "companionId": "user-alice",
      "companionName": "小悠",
      "companionColor": "#2563eb",
      "title": "京都",
      "scope": "international",
      "scopeId": "japan",
      "scopeName": "日本",
      "city": "京都",
      "priority": "medium",
      "targetYear": "2026",
      "importedTrips": [
        {
          "id": "trip-2026-spring",
          "name": "2026 江南春游"
        }
      ],
      "createdAt": "2026-05-03T00:00:00.000Z",
      "updatedAt": "2026-05-03T00:00:00.000Z"
    }
  ]
}
```

### `POST /api/wishlist`

请求体字段与规划项相似，但不绑定行程：`companionId / title / scope / scopeId / scopeName / city / note / priority / targetYear / guide`。

规则：

- `companionId` 必须属于当前账号。
- `priority` 可选，默认 `medium`。
- `targetYear` 可选，格式为 `YYYY`，提交 `null` 可清空。
- 同一账号、同一旅伴、同一 `scope / scopeId / city` 的未删除愿望项会被视为重复，返回 `409 CONFLICT`。

### `PATCH /api/wishlist/:itemId`

可更新 `title`、地点字段、`note`、`priority` 和 `targetYear`。

### `POST /api/wishlist/:itemId/convert-to-trip`

用途：

- 从单个愿望项创建新行程，并自动写入一条来源为该愿望项的行前规划。

请求体可选：

```json
{
  "name": "京都赏樱",
  "note": "从愿望地图创建",
  "startsAt": "2026-04-01",
  "endsAt": "2026-04-05"
}
```

成功响应：

```json
{
  "tripId": "trip-from-wishlist",
  "store": {
    "users": [],
    "trips": [],
    "markers": [],
    "wishlistItems": [],
    "activeUserId": "user-alice",
    "savedGuides": [],
    "guideSearchHistory": []
  }
}
```

规则：

- `wishlistId` 必须属于当前账号且未删除。
- 未传 `name` 时使用愿望标题作为行程名。
- 未传日期时优先用 `targetYear-01-01`，否则使用服务端当天日期。
- 自动创建的规划项会写入 `sourceWishlistId`，用于愿望项的“已导入”状态。

### `DELETE /api/wishlist/:itemId`

删除采用软删除，成功返回 `{ "deletedId": "wishlist-1" }`。

### `PATCH /api/trips/:id/planning/items/:itemId`

请求体：

```json
{
  "note": "改成下午去",
  "priority": "medium",
  "plannedDate": null
}
```

规则：

- 至少提交一个字段
- 可更新 `title`、地点字段、`note`、`priority`、`plannedDate`、`sortOrder`
- 已转换为旅行记录的规划项不能继续编辑，返回 `409 CONFLICT`

### `DELETE /api/trips/:id/planning/items/:itemId`

成功响应：

```json
{
  "deletedId": "planning-1"
}
```

规则：

- 删除采用软删除
- 当前账号不可访问的行程或条目统一返回 `404 NOT_FOUND`

### `POST /api/trips/:id/planning/items/:itemId/convert-to-marker`

请求体：

```json
{
  "visitedStartAt": "2026-05-02",
  "visitedEndAt": "2026-05-02",
  "note": "清晨抵达，游客很少"
}
```

成功响应：

- 返回最新的整包 `TravelStore`

规则：

- 服务端使用规划项地点、同行人和当前 `tripId` 创建正式旅行记录
- `visitedStartAt / visitedEndAt` 必填，格式为 `YYYY-MM-DD`
- `visitedEndAt` 不能早于 `visitedStartAt`
- 转换成功后写入 `convertedMarkerId` 并把规划项状态改为 `converted`
- 已转换规划项再次转换会返回 `409 CONFLICT`

### `GET /api/trips/:id/checklist`

用途：

- 返回某个行程当前的行前清单分组与摘要
- 供 `/trips/:id/checklist` 放大页与详情页局部刷新使用

成功响应示例：

```json
{
  "summary": {
    "total": 3,
    "preDepartureCount": 2,
    "inTransitCount": 1,
    "doneCount": 0
  },
  "groups": [
    {
      "stage": "pre_departure",
      "title": "出发前准备",
      "description": "把预约、路线、装备和行前确认放在这里。",
      "itemCount": 2,
      "items": [
        {
          "id": "item-1",
          "companionId": "user-alice",
          "companionName": "小悠",
          "companionColor": "#2563eb",
          "title": "提前确认清水寺预约方式",
          "note": "尽量避开中午高峰",
          "stage": "pre_departure",
          "sortOrder": 0,
          "origin": "generated",
          "sourceGuideTitle": "京都春日路线",
          "sourceGuideSourceName": "示例来源",
          "sourceGuideSourceUrl": "https://example.com/guides/kyoto",
          "sourceSnippet": "建议提前预约热门景点",
          "createdAt": "2026-05-01T00:00:00.000Z",
          "updatedAt": "2026-05-01T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

### `POST /api/trips/:id/checklist/generate`

请求体：

```json
{
  "companionId": "user-alice",
  "guide": {
    "title": "京都春日路线",
    "summary": "适合第一次去京都的三天行程。",
    "sourceName": "示例来源",
    "sourceUrl": "https://example.com/guides/kyoto"
  }
}
```

规则：

- 需要登录
- `id` 必须是当前账号可访问的行程
- 服务端会优先读取 `guide-api` 正文，再按固定规则提炼 3~8 条清单项
- 若正文不可用，则自动回退到 `guide.summary`
- 同一行程下会按“来源攻略 + 标准化标题”去重，避免重复生成

成功响应：

```json
{
  "createdCount": 4,
  "deduplicatedCount": 1,
  "items": []
}
```

### `POST /api/trips/:id/checklist/items`

请求体：

```json
{
  "companionId": "user-alice",
  "title": "准备机场到市区交通方案",
  "note": "优先考虑地铁和巴士接驳",
  "stage": "pre_departure"
}
```

规则：

- 手动新增一条 trip-bound checklist item
- `stage` 固定为 `pre_departure | in_transit | done`
- `title` 长度 `1-120`
- `note` 最多 `500` 字符

### `PATCH /api/trips/:id/checklist/items/:itemId`

请求体：

```json
{
  "stage": "done",
  "note": "已完成预约"
}
```

规则：

- 至少提交一个字段
- 可更新 `title`、`note`、`stage`、`sortOrder`
- 当 `stage` 变化且未显式传 `sortOrder` 时，服务端会自动将其放到新分组末尾

### `DELETE /api/trips/:id/checklist/items/:itemId`

成功响应：

```json
{
  "deletedId": "item-1"
}
```

规则：

- 删除采用软删除
- 当前账号不可访问的行程或条目统一返回 `404 NOT_FOUND`

### `PATCH /api/companions/:id`

请求体：

```json
{
  "name": "阿泽（更新）",
  "color": "#ea580c"
}
```

成功响应：

- 返回最新的整包 `TravelStore`

规则：

- 至少提交一个字段
- `id` 对应的旅伴必须存在且未软删除

错误：

- `400 INVALID_REQUEST`
- `404 NOT_FOUND`
- `409 CONFLICT`

## 旅行记录接口

### `GET /api/markers/search`

查询参数：

- `keyword`：可选，按地区、城市和游记描述做服务端全文搜索
- `companionId`：可选，限制到某个旅伴
- `scope`：可选，`domestic` / `international` / `all`，默认 `all`
- `tag`：可选，标签枚举值
- `mood`：可选，心情枚举值
- `weather`：可选，天气枚举值
- `transport`：可选，交通方式枚举值
- `budgetLevel`：可选，预算级别枚举值
- `year`：可选，按 `visitedStartAt` 年份筛选，格式 `YYYY`
- `page`：可选，默认 `1`
- `pageSize`：可选，默认 `20`，最大 `50`

成功响应：

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 0,
  "hasMore": false
}
```

规则：

- 仅返回当前登录账号下未删除的旅行记录
- 关键词命中 `scopeName`、`city` 或 `note`
- `tag` 采用“命中任一选中标签”的筛选语义；其余元数据筛选采用精确匹配
- 返回的 `items` 使用现有旅行记录 DTO
- 中文内容优先依赖 MySQL FULLTEXT ngram 索引，短关键词使用受限兜底匹配
- 每次成功搜索会写入 `marker_search_events`，记录账号、可选旅伴、关键词、范围、年份、结果总数、页码、页大小和搜索时间
- 前端旅行记录列表当前约定为输入关键词后按 Enter 发起搜索；旅伴、范围和年份筛选变更会复用已提交关键词刷新结果
- Each successful search writes to `marker_search_events`, including account, optional companion, keyword, scope, year, total result count, page, page size, and search time.
- The marker list submits keyword search on Enter; companion, scope, and year filter changes reuse the submitted keyword.

### `POST /api/markers`

请求体：

```json
{
  "companionId": "user-alice",
  "tripId": "trip-2026-spring",
  "scope": "international",
  "scopeId": "jp-kyoto",
  "scopeName": "京都府",
  "city": "京都",
  "note": "春天赏樱",
  "tags": ["citywalk", "photography"],
  "mood": "excited",
  "weather": "sunny",
  "transport": "walk",
  "budgetLevel": "medium",
  "imageUrls": ["https://example.com/1.jpg"],
  "visitedStartAt": "2026-04-01",
  "visitedEndAt": "2026-04-05"
}
```

成功响应：

- 返回最新的整包 `TravelStore`

规则：

- `visitedStartAt` / `visitedEndAt` 必须使用 `YYYY-MM-DD`
- `visitedEndAt` 不可早于 `visitedStartAt`
- `tags` 可选，最多 10 个固定枚举值
- `mood` / `weather` / `transport` / `budgetLevel` 都是可空的固定枚举值
- `imageUrls` 会映射到 `visit_marker_images`
- `companionId` 必须是当前账户下有效旅伴
- `tripId` 可选；若传入，必须是当前账户下有效行程

### `PATCH /api/markers/:id`

请求体：

```json
{
  "note": "更新后的备注",
  "tags": ["food", "weekend"],
  "mood": "relaxed",
  "weather": "cloudy",
  "transport": "train",
  "budgetLevel": "high",
  "imageUrls": ["https://example.com/updated.jpg"],
  "tripId": null
}
```

成功响应：

- 返回最新的整包 `TravelStore`

规则：

- 至少提交一个字段
- 新字段 `tags` / `mood` / `weather` / `transport` / `budgetLevel` 均支持轻量更新
- 若传入 `imageUrls`，服务端会重建该记录下的图片列表
- 若传入日期字段，仍会校验日期范围
- `tripId` 可传有效行程 id，传 `null` 表示解除行程归属

### `PATCH /api/markers/batch-trip`

请求体：

```json
{
  "markerIds": ["marker-1", "marker-2"],
  "tripId": "trip-2026-spring"
}
```

成功响应：

- 返回最新的整包 `TravelStore`

规则：

- `markerIds` 必填，至少 1 条，最多 100 条
- 所有 `markerIds` 都必须属于当前登录账号且未被删除
- `tripId` 可传有效行程 id，传 `null` 表示批量移回未归入行程
- 服务端会在单事务内完成校验和批量更新，避免部分成功部分失败
- 路由注册时必须让静态路径 `/api/markers/batch-trip` 先于 `/api/markers/:id`，避免被动态路径吞掉

### `DELETE /api/markers/:id`

成功响应：

- 返回最新的整包 `TravelStore`

规则：

- 删除采用软删除
- 同时软删除该记录下的攻略关联数据
- 不影响“普通收藏”上下文中的独立攻略收藏

## 攻略收藏与关联接口

### `GET /api/saved-guides`

查询参数：

- `companionId`：可选
- `markerId`：可选

成功响应：

```json
{
  "items": [
    {
      "id": "saved-guide-1",
      "savedByUserId": "user-alice",
      "markerId": "marker-1",
      "keyword": "京都",
      "result": {
        "id": "guide-1",
        "title": "京都三日路线",
        "summary": "适合第一次去京都。",
        "sourceName": "示例来源",
        "sourceUrl": "https://example.com/guides/kyoto"
      },
      "savedAt": "2026-04-22T00:00:00.000Z"
    }
  ]
}
```

### `POST /api/saved-guides`

请求体：

```json
{
  "savedByUserId": "user-alice",
  "markerId": "marker-1",
  "keyword": "京都",
  "result": {
    "id": "guide-1",
    "title": "京都三日路线",
    "summary": "适合第一次去京都。",
    "sourceName": "示例来源",
    "sourceUrl": "https://example.com/guides/kyoto"
  }
}
```

成功响应：

```json
{
  "item": {
    "id": "saved-guide-1",
    "savedByUserId": "user-alice",
    "markerId": "marker-1",
    "keyword": "京都",
    "result": {
      "id": "guide-1",
      "title": "京都三日路线",
      "summary": "适合第一次去京都。",
      "sourceName": "示例来源",
      "sourceUrl": "https://example.com/guides/kyoto"
    },
    "savedAt": "2026-04-22T00:00:00.000Z"
  },
  "deduplicated": false
}
```

规则：

- 普通收藏和关联收藏通过 `save_context_key` 区分：
  - 普通收藏：`favorite`
  - 记录关联：`marker:{markerId}`
- 同一用户、同一上下文、同一 `sourceUrl` 只保留一条
- 若命中去重，返回已有数据并携带 `deduplicated: true`
- 若传入 `markerId`，对应记录必须存在

### `DELETE /api/saved-guides/:id`

成功响应：

```json
{
  "deletedId": "saved-guide-1"
}
```

规则：

- 删除采用软删除

## 搜索历史接口

### `GET /api/guide-search-histories`

查询参数：

- `companionId`：可选
- `limit`：可选，默认服务端返回全部，前端通常传 `6`

成功响应：

```json
{
  "items": [
    {
      "id": "history-1",
      "keyword": "京都",
      "scope": "international",
      "createdAt": "2026-04-22T00:00:00.000Z"
    }
  ]
}
```

### `POST /api/guide-search-histories`

请求体：

```json
{
  "companionId": "user-alice",
  "keyword": "京都",
  "scope": "international"
}
```

成功响应：

```json
{
  "item": {
    "id": "history-1",
    "keyword": "京都",
    "scope": "international",
    "createdAt": "2026-04-22T00:00:00.000Z"
  },
  "deduplicated": true
}
```

规则：

- 关键词会做 `trim + lowercase` 标准化
- 同一用户、同一关键词、同一范围命中已有记录时，不新增新记录，而是刷新时间并返回 `deduplicated: true`

## 当前前端接入点

前端当前通过以下模块调用主业务 API：

- `src/lib/api/appBootstrapApi.ts`
- `src/lib/api/companionsApi.ts`
- `src/lib/api/markersApi.ts`
- `src/lib/api/savedGuidesApi.ts`
- `src/lib/api/guideSearchHistoryApi.ts`
- `src/lib/api/tripsApi.ts`
- `src/lib/repositories/remoteTravelStoreRepository.ts`

## 联调建议

推荐联调顺序：

1. 先检查 `GET /health`
2. 再检查 `GET /api/app/bootstrap`
3. 再验证 `companions` / `markers`
4. 最后验证 `saved-guides` / `guide-search-histories`

若出现数据库不可用：

- 确认 MySQL 已启动
- 确认 `DATABASE_URL` 指向 `127.0.0.1:3306`
- 确认已执行 `npm run db:generate`、`npm run db:migrate:deploy`（或本地对应 migrate 流程）、`npm run db:seed`
