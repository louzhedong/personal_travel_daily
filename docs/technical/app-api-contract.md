# App API Contract

主业务 API 由 `server/appApiServer.ts` 提供，默认监听 `http://0.0.0.0:8788`。

当前版本职责：

- 提供旅行主数据聚合加载能力
- 提供旅伴、行程集合、旅行记录、攻略收藏/关联、搜索历史的服务端读写接口
- 作为前端 `remoteTravelStoreRepository` 的默认数据源

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

### 通用错误码

- `400 INVALID_REQUEST`
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 NOT_FOUND`
- `409 CONFLICT`
- `503 DATABASE_UNAVAILABLE`
- `500 INTERNAL_SERVER_ERROR`

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
- 按“账号 -> 同行人 -> 旅行记录 / 收藏攻略 / 攻略搜索历史”，以及“账号 -> 旅行记录搜索行为”返回只读树状数据
- Admin-only overview of all system accounts.
- Returns a read-only tree for "account -> companions -> markers / saved guides / guide search history", plus account-level marker search behavior.

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
          "markerSearchEventCount": 1
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
- 供首页第二屏“行程统计中心”使用

权限：

- 需要登录

查询参数：

- `year`：可选，格式 `YYYY`
- `scope`：可选，`all | domestic | international`
- `companionId`：可选，单旅伴筛选
- `tripId`：可选，单行程筛选；传 `unassigned` 表示未归入行程

成功响应示例：

```json
{
  "filters": {
    "year": "all",
    "scope": "all"
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
  "tripHighlights": {},
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
- 供首页统计中心点击行程后进入详情页使用

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
      "markerId": "marker-1",
      "markerTitle": "浙江 · 杭州",
      "imageUrl": "https://example.com/hangzhou-1.jpg",
      "visitedStartAt": "2026-05-01",
      "scopeName": "浙江",
      "city": "杭州"
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

错误：

- `400 INVALID_REQUEST`
- `401 UNAUTHORIZED`
- `404 NOT_FOUND`
- `503 DATABASE_UNAVAILABLE`

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
- `imageUrls` 会映射到 `visit_marker_images`
- `companionId` 必须是当前账户下有效旅伴
- `tripId` 可选；若传入，必须是当前账户下有效行程

### `PATCH /api/markers/:id`

请求体：

```json
{
  "note": "更新后的备注",
  "imageUrls": ["https://example.com/updated.jpg"],
  "tripId": null
}
```

成功响应：

- 返回最新的整包 `TravelStore`

规则：

- 至少提交一个字段
- 若传入 `imageUrls`，服务端会重建该记录下的图片列表
- 若传入日期字段，仍会校验日期范围
- `tripId` 可传有效行程 id，传 `null` 表示解除行程归属

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
- 确认已执行 `npm run db:generate`、`npm run db:push`、`npm run db:seed`
