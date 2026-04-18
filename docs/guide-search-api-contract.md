# Guide Search API Contract

本文档约定 `remote provider` 对接的后端抓取聚合服务接口。前端不会直接抓取第三方网页，而是统一调用该服务获取结构化结果。

## 1. Base URL

- 环境变量：`VITE_GUIDE_SEARCH_API_BASE_URL`
- 示例：`https://guide-api.example.com`

## 2. Authentication

- 可选环境变量：`VITE_GUIDE_SEARCH_API_KEY`
- 若存在，前端会以 `Authorization: Bearer <token>` 形式发送

## 3. Search API

### Request

- Method: `POST`
- Path: `/search`
- Content-Type: `application/json`

```json
{
  "keyword": "京都 赏樱 攻略",
  "scope": "international",
  "page": 1,
  "pageSize": 8,
  "markerId": "marker-123"
}
```

### Response

```json
{
  "items": [
    {
      "id": "guide-kyoto-spring",
      "title": "京都春日赏樱旅行攻略",
      "summary": "围绕清水寺、哲学之道与岚山的一条轻松赏樱路线。",
      "coverImageUrl": "https://cdn.example.com/kyoto.jpg",
      "sourceName": "Example Travel",
      "sourceUrl": "https://travel.example.com/kyoto-spring",
      "authorName": "Example Editor",
      "publishedAt": "2026-03-01",
      "destinationLabel": "京都",
      "tags": ["赏樱", "春季", "3天"]
    }
  ],
  "page": 1,
  "pageSize": 8,
  "hasMore": true,
  "provider": "crawler-aggregator",
  "fetchedAt": "2026-04-17T12:00:00.000Z"
}
```

### Constraints

- `keyword` 必填
- `scope` 允许值：`domestic`、`international`、`all`
- 若无结果，返回 `items: []`

## 4. Document API

### Request

- Method: `POST`
- Path: `/document`
- Content-Type: `application/json`

```json
{
  "sourceUrl": "https://travel.example.com/kyoto-spring"
}
```

### Response

```json
{
  "id": "guide-kyoto-spring",
  "title": "京都春日赏樱旅行攻略",
  "summary": "围绕清水寺、哲学之道与岚山的一条轻松赏樱路线。",
  "coverImageUrl": "https://cdn.example.com/kyoto.jpg",
  "sourceName": "Example Travel",
  "sourceUrl": "https://travel.example.com/kyoto-spring",
  "authorName": "Example Editor",
  "publishedAt": "2026-03-01",
  "destinationLabel": "京都",
  "tags": ["赏樱", "春季", "3天"],
  "blocks": [
    {
      "id": "block-1",
      "type": "section-title",
      "text": "最佳季节"
    },
    {
      "id": "block-2",
      "type": "paragraph",
      "text": "3 月下旬到 4 月上旬是京都樱花观赏高峰。"
    },
    {
      "id": "block-3",
      "type": "bullet-list",
      "text": "清水寺 - 哲学之道 - 岚山"
    }
  ],
  "fetchedAt": "2026-04-17T12:02:00.000Z"
}
```

### Constraints

- `blocks[].type` 允许值：`paragraph`、`bullet-list`、`section-title`、`tips`
- 若源文档不存在，返回 `404`
- 首版只返回结构化摘要与片段，不返回第三方全文 HTML

## 5. Error Response

统一错误结构建议：

```json
{
  "error": {
    "code": "GUIDE_SEARCH_UNAVAILABLE",
    "message": "Guide search service is temporarily unavailable"
  }
}
```

建议状态码：

- `400`: 参数错误
- `401`: 鉴权失败
- `404`: 正文不存在
- `429`: 频率受限
- `500`: 服务异常

## 6. Frontend Expectations

- 搜索列表接口可被缓存 6 小时
- 正文片段接口可被缓存 24 小时
- 前端默认展示摘要与结构化片段，不展示第三方全文镜像

## 7. Adapter Notes

- 当前聚合服务仅保留中文攻略来源，并同时包含本地 seed 数据、本地文件缓存库和真实站点 adapter
- 已接入中文来源：
  - `维基导游（zh.wikivoyage.org）`
  - `京都旅游中文官网（kyoto.travel/cn）`
- `/search` 会优先检索本地 seed 数据和已缓存文件，再补充 adapter 的实时搜索结果
- `/document` 会优先命中文件缓存库，未命中时再按 `sourceUrl` 触发对应 adapter 的抓取与清洗流程
- 成功抓取的正文会落到服务端本地文件库，供后续搜索和详情直接复用
- 当远程站点暂时不可用时，`/document` 返回 `502`，错误码为 `GUIDE_SOURCE_UNAVAILABLE`
