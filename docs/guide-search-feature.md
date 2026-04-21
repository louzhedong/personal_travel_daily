# 攻略搜索功能说明

本文档描述当前仓库里已经落地的“攻略搜索、收藏与关联”能力，重点覆盖用户入口、核心交互、缓存机制、数据模型和当前已知边界。

## 1. 当前功能范围

当前版本已经支持：

- 在首页 Hero 区打开攻略搜索面板
- 在旅行记录详情面板中，一键以 `${scopeName} ${city} 攻略` 打开搜索
- 按关键词搜索攻略，支持 `全部 / 国内 / 国际` 范围切换
- 查看结果摘要、来源、标签、封面和结构化正文片段
- 跳转原始来源页面
- 将攻略收藏为独立条目
- 将攻略关联到当前打开的旅行记录
- 在“我的攻略收藏”侧栏中查看当前用户的独立收藏和已关联条目
- 保存最近搜索词到本地 `IndexedDB`
- 缓存搜索结果与正文片段，减少重复请求

当前版本暂未完善：

- 收藏 / 关联的权限边界仍需进一步收敛
- 收藏去重与关联去重在 UI 和 repository 中还没有完全收敛成单一实现
- 地图区域级快捷搜索入口尚未开放
- “加载更多”与分页浏览尚未提供 UI

## 2. 用户入口

当前有两个明确入口：

1. 首页 Hero 区按钮
   - 行为：打开攻略搜索面板
   - 初始关键词为空
   - 初始范围为 `all`

2. 旅行记录详情面板按钮
   - 行为：自动带入 `${scopeName} ${city} 攻略`
   - 范围沿用当前记录的 `scope`
   - 如果后续继续完善权限边界，这个入口应和记录的可编辑权限保持一致

涉及文件：

- [src/modules/App.tsx](../src/modules/App.tsx)
- [src/components/GuideSearchPanel.tsx](../src/components/GuideSearchPanel.tsx)
- [src/components/MarkerDetailPanel.tsx](../src/components/MarkerDetailPanel.tsx)

## 3. 主要交互

### 3.1 搜索攻略

1. 打开攻略搜索面板
2. 输入关键词
3. 选择范围：`全部 / 国内 / 国际`
4. 点击“搜索”或按回车
5. 在结果列表中查看候选攻略
6. 点击“查看片段”加载结构化正文片段

推荐关键词示例：

- `京都 樱花 攻略`
- `杭州 周末 攻略`
- `云南 自驾 攻略`
- `首尔 美食 攻略`

### 3.2 收藏攻略

- 在搜索结果卡片中点击“收藏攻略”
- 收藏后会进入当前用户的“我的攻略收藏”
- 收藏状态通过 `savedGuides` 中“无 `markerId` 的 `SavedGuide`”表示

当前实现状态：

- 收藏判定按 `savedByUserId + sourceUrl` 组合去重
- 当前 UI 会把重复收藏视为 no-op
- repository 中同时存在 `upsertSavedGuide` 逻辑，但当前页面状态更新尚未完全复用这套实现

### 3.3 关联到旅行记录

- 只有当搜索面板是从某条记录上下文打开时，结果卡片才会出现“关联到当前记录”
- 关联成功后，会新增一条带 `markerId` 的 `SavedGuide`
- 在记录详情页的“相关攻略”区域可以看到这些关联内容

注意：

- `SavedGuide` 的“独立收藏”和“关联到记录”是两类不同条目
- 同一来源可以同时存在一条独立收藏和一条记录关联

### 3.4 我的攻略收藏

`SavedGuidesPanel` 当前只展示当前用户的收藏，支持：

- 查看全部
- 只看已关联
- 只看未关联
- 定位到关联记录
- 查看原文
- 取消收藏 / 移除收藏

涉及文件：

- [src/components/SavedGuidesPanel.tsx](../src/components/SavedGuidesPanel.tsx)
- [src/modules/App.tsx](../src/modules/App.tsx)

## 4. 数据模型

### 4.1 搜索结果

```ts
interface GuideSearchResult {
  id: string;
  title: string;
  summary: string;
  coverImageUrl?: string;
  sourceName: string;
  sourceUrl: string;
  authorName?: string;
  publishedAt?: string;
  destinationLabel?: string;
  tags?: string[];
}
```

### 4.2 收藏与关联

```ts
interface SavedGuide {
  id: string;
  markerId?: string;
  savedByUserId: string;
  keyword: string;
  result: GuideSearchResult | GuideDocument;
  savedAt: string;
}
```

判定方式：

- `markerId` 为空：独立收藏
- `markerId` 有值：关联到某条旅行记录
- `savedByUserId`：创建该收藏 / 关联的用户

## 5. 本地缓存与持久化

攻略相关数据保存在浏览器 `IndexedDB` 中，主要 object store 包括：

- `savedGuides`
- `guideSearchHistory`
- `guideSearchCache`
- `guideDocumentCache`

当前缓存策略：

- 搜索结果缓存 TTL：30 分钟
- 正文缓存 TTL：24 小时
- 最近搜索默认读取最近 20 条，搜索面板展示最近 6 条

关键缓存键：

- 搜索缓存：`v3:${scope}:${keyword}:${page}:${pageSize}`
- 正文缓存：`sourceUrl.trim().toLowerCase()`
- 收藏身份：`savedByUserId + markerId + normalized sourceUrl`

涉及文件：

- [src/lib/repositories/guideRepository.ts](../src/lib/repositories/guideRepository.ts)
- [src/lib/storage.ts](../src/lib/storage.ts)

## 6. 服务端接口

当前 `remote provider` 默认依赖本地攻略服务：

- `GET /health`
- `POST /api/guides/search`
- `POST /api/guides/document`

详细请求 / 响应结构见：

- [docs/guide-search-api-contract.md](./guide-search-api-contract.md)

## 7. 当前已知边界

当前仓库虽然已经有收藏和关联能力，但在后续开发中要特别注意下面三点：

1. 收藏和关联的权限边界还需要继续收敛
   - 尤其是“查看他人记录时是否允许继续搜索、关联或解除关联”

2. 收藏去重与关联去重应收敛到一套单一规则
   - 不应让 UI 状态流和 repository 各自维护不同语义

3. 文档中的“预期规则”和代码中的“当前实现”可能暂时不完全一致
   - 后续修复实现时，优先对齐 [攻略搜索 / 收藏 / 关联设计文档](./travel-guide-search-design.md)

## 8. 相关测试

当前仓库已有以下相关测试：

- `src/components/__tests__/GuideSearchPanel.spec.tsx`
- `src/components/__tests__/SavedGuidesPanel.spec.tsx`
- `src/components/__tests__/MarkerDetailPanel.spec.tsx`
- `src/lib/repositories/__tests__/guideRepository.spec.ts`

建议在继续迭代前，优先补齐以下场景：

- 当前用户操作自己的记录
- 当前用户查看他人的记录
- 重复收藏
- 重复关联
- 解除关联和取消收藏的差异
