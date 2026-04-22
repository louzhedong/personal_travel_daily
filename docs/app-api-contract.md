# App API Contract

主业务 API 由 `server/appApiServer.ts` 提供，默认监听 `http://0.0.0.0:8788`。

当前版本职责：

- 提供旅行主数据聚合加载能力
- 提供旅伴、旅行记录、攻略收藏/关联、搜索历史的服务端读写接口
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
- `404 NOT_FOUND`
- `409 CONFLICT`
- `503 DATABASE_UNAVAILABLE`
- `500 INTERNAL_SERVER_ERROR`

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

### `POST /api/markers`

请求体：

```json
{
  "companionId": "user-alice",
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

### `PATCH /api/markers/:id`

请求体：

```json
{
  "note": "更新后的备注",
  "imageUrls": ["https://example.com/updated.jpg"]
}
```

成功响应：

- 返回最新的整包 `TravelStore`

规则：

- 至少提交一个字段
- 若传入 `imageUrls`，服务端会重建该记录下的图片列表
- 若传入日期字段，仍会校验日期范围

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
