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
