# 攻略搜索 / 收藏 / 关联设计文档

本文档不再停留在“功能设想”层，而是用于约束当前仓库里已经落地的攻略能力，明确状态结构、交互流、权限边界、去重规则和测试关注点，作为后续实现修复和扩展的参考基线。

## 1. 设计目标

围绕旅行记录补齐一条轻量但闭环的攻略辅助链路：

- 出发前：搜索某个目的地的攻略
- 浏览中：快速查看摘要、正文片段和原文链接
- 留存时：把有价值的攻略收藏下来
- 回看时：把攻略挂到某条旅行记录上，方便回顾

同时保持以下原则：

- 地图记录仍然是主流程，攻略能力是增强而不是替代
- 攻略数据和旅行记录数据要保持角色清晰
- 收藏 / 关联的身份规则必须单一且可解释
- UI 层和 repository 层不要长期维护两套不同语义

## 2. 当前实现架构

### 2.1 前端分层

1. `App.tsx`
   - 托管搜索抽屉开关
   - 托管当前搜索上下文
   - 维护 `savedGuides` 的页面级状态

2. `GuideSearchPanel`
   - 输入关键词
   - 发起搜索
   - 查看正文片段
   - 发起收藏 / 关联 / 移除动作

3. `SavedGuidesPanel`
   - 展示当前用户收藏列表
   - 在独立收藏和已关联内容之间切换查看

4. `MarkerDetailPanel`
   - 展示记录详情
   - 展示与记录有关的攻略
   - 触发“查找攻略”入口

5. `guideRepository`
   - 保存搜索历史
   - 保存搜索缓存
   - 保存正文缓存
   - 保存 / 查询 `SavedGuide`

### 2.2 服务端分层

- `guideApiServer.mjs` 提供统一 HTTP 接口
- `guideSearchEngine.mjs` 聚合不同 adapter 的结果
- `server/adapters/*` 负责具体来源接入
- `guideFileStore.mjs` 负责缓存文档落盘

## 3. 核心数据结构

### 3.1 搜索结果

```ts
interface GuideSearchResult {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  coverImageUrl?: string;
  authorName?: string;
  publishedAt?: string;
  destinationLabel?: string;
  tags?: string[];
}
```

### 3.2 收藏 / 关联模型

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

语义划分：

- `savedByUserId`
  - 谁创建了这条收藏 / 关联
- `markerId`
  - 这条攻略是否挂到某条旅行记录上
- `result`
  - 存储攻略快照，而不是仅保存 sourceUrl

## 4. 交互流设计

### 4.1 搜索流

1. 从 Hero 或记录详情打开搜索面板
2. 输入或自动带入关键词
3. 选择范围
4. 获取结果列表
5. 按需查看正文片段

### 4.2 收藏流

1. 用户在结果卡片点击“收藏攻略”
2. 系统以“当前用户 + 空 markerId + 规范化 sourceUrl”作为身份判定
3. 若不存在，则创建独立收藏
4. 若已存在，则更新或忽略，取决于统一去重策略

### 4.3 关联流

1. 用户从某条旅行记录的上下文打开搜索面板
2. 在结果卡片点击“关联到当前记录”
3. 系统以“当前用户 + 当前 markerId + 规范化 sourceUrl”作为身份判定
4. 若不存在，则创建一条带 `markerId` 的 `SavedGuide`

### 4.4 回看流

1. 在 `SavedGuidesPanel` 中查看当前用户的收藏内容
2. 对已关联条目可定位回对应记录
3. 在 `MarkerDetailPanel` 中查看该记录的相关攻略

## 5. 权限与归属规则

这部分是当前最需要文档化的内容，也是最近 review 暴露问题的核心。

### 5.1 记录归属

- `VisitMarker.userId` 决定一条旅行记录属于谁
- 只有当前用户等于 `marker.userId` 时，才应被视为“可编辑记录”

### 5.2 收藏归属

- `SavedGuide.savedByUserId` 决定一条收藏 / 关联是谁创建的
- “我的攻略收藏”只应展示当前用户创建的条目

### 5.3 推荐的权限边界

推荐把行为约束为：

- 查看他人记录：允许
- 搜索攻略：允许
- 收藏攻略到“我的收藏”：允许
- 把攻略关联到他人的旅行记录：不允许
- 解除他人记录上的攻略关联：不允许
- 编辑 / 删除他人的旅行记录：不允许

这样做的原因：

- 收藏是个人行为，可以独立存在
- 关联是对某条记录的结构性修改，应受记录所有者约束
- 否则会出现“我能往别人的记录挂内容，也能帮别人移除内容”的越权问题

### 5.4 当前实现差距

当前实现中，以下规则还没有完全落稳：

- 从记录详情进入搜索时，关联动作没有完全和记录 ownership 绑定
- 详情页对相关攻略的解除关联动作没有充分区分“是否有权操作”
- 这些问题已在最近一轮 review 中暴露，后续代码修复应优先参考本节规则

## 6. 去重与一致性规则

### 6.1 规范化规则

所有收藏 / 关联身份判定都应基于：

- `savedByUserId`
- `markerId ?? '__favorite__'`
- `sourceUrl.trim().toLowerCase()`

### 6.2 推荐身份定义

```ts
identity = `${savedByUserId}::${markerId ?? '__favorite__'}::${normalizedSourceUrl}`;
```

### 6.3 推荐一致性要求

- UI 层不要自己再维护一套不同的身份判定实现
- repository 应成为收藏 / 关联身份规则的单一来源
- 如果允许“重复点击时更新摘要或 keyword”，该语义也应统一定义在 repository 层

### 6.4 当前实现差距

当前仓库已经在 `guideRepository.ts` 中引入：

- `buildSavedGuideIdentity`
- `findSavedGuideBySourceUrl`
- `upsertSavedGuide`

但页面状态流里仍然存在一套单独的 `findSavedGuide` 和数组更新逻辑。后续建议：

1. 把身份判定收敛到 repository helper
2. 让 UI 只表达意图，不再手写判重规则
3. 统一“重复收藏 / 重复关联”的处理语义

## 7. 测试矩阵

后续和攻略收藏 / 关联有关的测试，至少覆盖下面这些场景：

### 7.1 正向场景

- 当前用户搜索攻略并完成独立收藏
- 当前用户从自己的记录上下文中完成关联
- 当前用户在收藏侧栏中定位到关联记录
- 当前用户查看正文片段与原文链接

### 7.2 权限场景

- 当前用户查看他人记录时，不应出现可修改对方记录的关联操作
- 当前用户查看他人记录时，不应能解除对方已建立的关联

### 7.3 去重场景

- 对同一来源重复收藏，不应产生重复条目
- 对同一记录重复关联同一来源，不应产生重复条目
- 同一来源允许同时存在“独立收藏”和“记录关联”两类条目

### 7.4 数据完整性场景

- 删除记录时，挂在该记录下的关联条目如何处理
- 数据恢复后，`savedGuides` 与 `markers` 是否还能正确对应
- repository 恢复出的条目顺序是否符合 `savedAt desc`

## 8. 后续文档约束

后续任何和攻略能力有关的改动，都建议同步检查以下文档是否需要更新：

- [README](../README.md)
- [项目总览](./project-overview.md)
- [攻略搜索功能说明](./guide-search-feature.md)
- [Guide Search API Contract](./guide-search-api-contract.md)

如果改动涉及权限、归属、去重或状态模型，应优先更新本文档，而不是只改界面说明。
