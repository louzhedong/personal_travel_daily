# Guide Search API Contract

本地攻略 API 由 `server/guideApiServer.mjs` 提供，默认监听 `http://0.0.0.0:8383`。

## 健康检查

### `GET /health`

响应示例：

```json
{
  "ok": true,
  "provider": "guide-api-local",
  "adapters": [
    "qyer-forum",
    "geoapify-poi",
    "zh-wikivoyage",
    "zh-wikipedia",
    "domestic-poi-starter",
    "kyoto-travel-cn"
  ],
  "cachedDocuments": 12
}
```

## 搜索攻略

### `POST /api/guides/search`

请求体：

```json
{
  "keyword": "京都",
  "scope": "international",
  "page": 1,
  "pageSize": 10,
  "markerId": "optional-marker-id"
}
```

字段说明：

- `keyword`: 必填
- `scope`: 可选，`domestic` | `international` | `all`
- `page`: 可选，默认 `1`
- `pageSize`: 可选，默认 `10`
- `companionId`: 可选，用于前端记录搜索日志时回传当前操作旅伴
- `markerId`: 可选，仅用于前端上下文透传

成功响应：

```json
{
  "items": [
    {
      "id": "guide-1",
      "title": "京都三日路线",
      "summary": "适合第一次去京都的轻量路线。",
      "sourceName": "示例来源",
      "sourceUrl": "https://example.com/guides/kyoto",
      "destinationLabel": "京都",
      "tags": ["寺庙", "步行"]
    }
  ],
  "page": 1,
  "pageSize": 10,
  "hasMore": false,
  "provider": "guide-api-local",
  "fetchedAt": "2026-04-21T12:00:00.000Z"
}
```

错误：

- `400 INVALID_SEARCH_KEYWORD`
- `400 INVALID_JSON`
- `405 METHOD_NOT_ALLOWED`

## 拉取攻略正文

### `POST /api/guides/document`

请求体：

```json
{
  "sourceUrl": "https://example.com/guides/kyoto"
}
```

成功响应：

```json
{
  "id": "guide-1",
  "title": "京都三日路线",
  "summary": "适合第一次去京都的轻量路线。",
  "sourceName": "示例来源",
  "sourceUrl": "https://example.com/guides/kyoto",
  "blocks": [
    {
      "id": "block-1",
      "type": "section-title",
      "text": "Day 1"
    },
    {
      "id": "block-2",
      "type": "paragraph",
      "text": "上午先去清水寺。"
    }
  ],
  "fetchedAt": "2026-04-21T12:00:00.000Z"
}
```

错误：

- `400 INVALID_SOURCE_URL`
- `400 INVALID_JSON`
- `404 GUIDE_DOCUMENT_NOT_FOUND`
- `405 METHOD_NOT_ALLOWED`
- `502 GUIDE_SOURCE_UNAVAILABLE`

## 行为说明

- 搜索会合并缓存文档、种子数据、适配器静态条目和远程抓取结果
- 文档请求优先命中种子数据，其次命中磁盘缓存，最后再走适配器抓取
- 当前服务允许跨域，适合本地前后端联调

## App API 扩展 / App API Extensions

以下接口不属于 `guide-api` 本身，而是由主业务 `app-api` 提供，用于补齐搜索治理、后台观察和前端建议数据。

The endpoints below do not belong to the `guide-api` process itself. They are served by the main `app-api` to support governance, admin observability, and frontend suggestion data.

### `POST /api/guide-search-histories`

请求体新增可选字段：

The request body now supports an extra optional field:

```json
{
  "companionId": "user-alice",
  "keyword": "京都",
  "scope": "international",
  "lastResultCount": 6
}
```

- `lastResultCount`: 最近一次搜索命中的结果数量，用于建议与历史快捷展示
- `lastResultCount`: the number of results returned by the latest search, used by suggestion chips and recent-search shortcuts

### `POST /api/guide-search-logs`

请求体：

Request body:

```json
{
  "companionId": "user-alice",
  "keyword": "京都",
  "scope": "international",
  "provider": "remote",
  "page": 1,
  "pageSize": 8,
  "resultCount": 6,
  "hasMore": true,
  "durationMs": 182,
  "status": "success",
  "sourceName": "Qyer",
  "sourceDomain": "qyer.com"
}
```

字段说明：

Field notes:

- `status`: `success | empty | error`
- `errorCode`: 可选，仅在失败时回传
- `sourceName / sourceDomain`: 可选，用于来源健康度聚合

### `GET /api/guide-source-health`

查询参数：

Query string:

- `limit`: 可选，默认 `20`，最大 `50`

成功响应：

Success response:

```json
{
  "items": [
    {
      "id": "health-1",
      "sourceName": "Qyer",
      "sourceDomain": "qyer.com",
      "recentSuccess": 4,
      "recentFailure": 1,
      "lastFailureReason": "timeout"
    }
  ]
}
```

### `GET /api/admin/overview`

管理员概览响应新增：

The admin overview response now also includes:

- `guideSearchTrends`
- `guideSearchStatusBreakdown`
- `guideSourceHealth`
