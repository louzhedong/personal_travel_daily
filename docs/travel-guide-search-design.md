# 攻略搜索 / 收藏 / 关联设计

## 设计目标

让“搜索攻略”“收藏攻略”“把攻略绑定到某条旅行记录”三件事既能互通，又不混淆语义。

## 领域对象

### 搜索结果

`GuideSearchResult` 用于列表展示和轻量信息传递。

### 正文文档

`GuideDocument` 用于查看结构化正文块。

### 已保存攻略

`SavedGuide` 统一表示两种场景：

- 用户收藏：`markerId` 为空
- 记录关联：`markerId` 为具体旅行记录 ID

## 去重规则

系统以如下身份键判断重复：

```text
savedByUserId :: markerId-or-__favorite__ :: normalizedSourceUrl
```

这意味着：

- 同一用户收藏同一篇攻略不会重复
- 同一用户把同一篇攻略关联到同一条记录不会重复
- 同一篇攻略既可以被收藏，也可以被关联到不同记录

## 当前实现位置

### 仓库层

- `src/lib/repositories/guideRepository.ts`

负责：

- 搜索历史去重
- 搜索缓存
- 正文缓存
- 已保存攻略读写
- 已保存攻略去重 upsert

### 页面动作层

- `src/modules/app/guideActions.ts`
- `src/modules/app/useTravelStoreActions.ts`

负责：

- 把收藏/关联写入当前前端 store
- 在页面层产生用户提示文案
- 删除记录时同步清理记录关联的攻略

## UI 入口与职责

### `GuideSearchPanel`

- 发起搜索
- 预览正文
- 收藏攻略
- 关联到指定记录
- 移除已保存攻略

### `SavedGuidesPanel`

- 展示当前用户收藏与记录关联的攻略
- 点击可回到对应旅行记录
- 支持移除收藏或关联

### `MarkerDetailPanel`

- 展示当前记录关联的攻略
- 从详情内继续打开攻略搜索
- 支持解除关联

## 权限边界

- 当前实现下，仅允许当前活跃用户对自己的记录建立或解除关联
- 收藏是保存到当前活跃用户名下
- 删除记录时，只会清理该记录下的关联，不影响纯收藏项

## 后续扩展建议

- 如需多人协作同步，优先把 `SavedGuide` 身份规则迁移到服务端统一裁决
- 如需支持标签、收藏夹或攻略分组，可在 `SavedGuide` 上扩展元信息，但保留现有 identity 规则
