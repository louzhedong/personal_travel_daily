# 攻略搜索专项 Prompt

本文档提供一组面向“搜索攻略”功能的专项 prompt，可直接复制给 AI 使用。目标是让 AI 在继续开发、优化交互、补文档或排查问题时，始终建立在当前仓库的真实实现之上。

## 1. 通用上下文 Prompt

```md
你正在维护 `旅迹地图 / Voyage Atlas` 项目的“搜索攻略”功能。

请基于当前仓库已经存在的实现继续工作，而不是重新设计一套全新的方案。

当前已知实现如下：

- 首页 Hero 区有 `搜索旅游攻略` 入口
- `MarkerDetailPanel` 中有 `查找攻略` 入口
- 攻略搜索 UI 由 `src/components/GuideSearchPanel.tsx` 承载
- 前端通过 `guideSearchService.ts` 和 `guideContentService.ts` 调用 provider
- provider 分为：
  - `mockGuideSearchProvider`
  - `remoteGuideSearchProvider`
- 远程接口默认对接：
  - `POST /api/guides/search`
  - `POST /api/guides/document`
- 本地缓存与历史记录由 `src/lib/repositories/guideRepository.ts` 管理
- IndexedDB 中已存在：
  - `savedGuides`
  - `guideSearchHistory`
  - `guideSearchCache`
  - `guideDocumentCache`
- 当前界面已支持：
  - 关键词搜索
  - `all / domestic / international` 范围切换
  - 最近搜索词
  - 结果卡片展示
  - 正文片段查看
  - 原始来源链接跳转
  - 独立收藏攻略
  - 将攻略关联到当前记录
  - 在 `SavedGuidesPanel` 查看当前用户收藏

工作要求：

1. 先阅读并理解现有实现，再给出增量方案
2. 不要把攻略搜索做成后台检索工具
3. 保持当前旅行品牌感和抽屉式交互语言
4. 优先做最小可维护改动
5. 若改动数据结构、缓存或接口，必须说明影响范围
6. 若改动收藏 / 关联逻辑，必须说明权限边界与去重规则
7. 若改动完成，执行必要验证并说明结果
```

## 2. 开发实现 Prompt

适合用于“继续开发攻略搜索功能”。

```md
请继续完善 `旅迹地图 / Voyage Atlas` 中的“搜索攻略”功能。

在开始前请先完成以下事情：

1. 阅读现有实现，重点关注：
   - `src/components/GuideSearchPanel.tsx`
   - `src/components/MarkerDetailPanel.tsx`
   - `src/modules/App.tsx`
   - `src/lib/guides/guideSearchService.ts`
   - `src/lib/guides/guideContentService.ts`
   - `src/lib/guides/providers/remoteGuideSearchProvider.ts`
   - `src/lib/repositories/guideRepository.ts`
   - `server/guideApiServer.mjs`
2. 说明你理解到的当前能力边界
3. 给出最小可行改动方案

实现要求：

- 优先复用已有 provider / repository / panel 架构
- 不要粗暴重写搜索面板
- 不要把 UI 做成重工具化的后台搜索页
- 如果涉及收藏 / 关联，优先统一 identity 规则，不要在 UI 和 repository 里各写一套判定
- 如果涉及 IndexedDB，说明是否需要 migration
- 如果涉及服务端接口，说明是否影响 `/api/guides/search` 或 `/api/guides/document`
- 如果涉及样式，保持与现有 `MarkerDetailPanel` 一致的品牌化抽屉语言
- 补最小必要测试

输出时请按以下结构：

1. 当前现状
2. 影响范围
3. 实施方案
4. 风险点
5. 验证结果
```

## 3. 设计优化 Prompt

适合用于“优化攻略搜索面板的 UI / 交互”。

```md
请优化 `旅迹地图 / Voyage Atlas` 中“搜索攻略”面板的体验，但必须保留当前产品的旅行品牌感。

请遵循以下约束：

- 它应该像“旅途灵感入口”而不是“搜索后台”
- 保持抽屉式侧边详情语言
- 搜索框、筛选 chips、结果卡片、正文片段区要有清晰层次
- 尽量通过背景层次、阴影和品牌色建立结构，而不是加重边框
- 复用蓝 / 青 / 橙品牌色体系
- 不引入过度复杂的筛选器矩阵
- 不新增和当前产品无关的重功能控件

请先说明：

1. 当前界面哪里像工具、哪里还不够像旅行内容产品
2. 你打算如何强化“目的地探索”语义
3. 你会如何处理搜索框、结果卡片和正文片段区的层次

然后再给出实现方案。
```

## 4. 文档补充 Prompt

适合用于“补文档、README、Prompt 文档”。

```md
请为 `旅迹地图 / Voyage Atlas` 中的“搜索攻略”功能补充文档。

要求：

- 文档内容必须以当前仓库已实现能力为准
- 明确区分：
  - 已实现能力
  - 已预留但未接通能力
  - 暂未开放能力
- 优先补充以下内容：
  - 功能入口
  - 使用方式
  - 启动方式
  - 环境变量
  - 接口路径
  - 缓存和本地存储
  - 测试覆盖
  - 已知限制
- 如果已有旧文档或旧 prompt 未同步，请一并校正

请先列出你计划更新的文件，再实施修改。
```

## 5. Bug 排查 Prompt

适合用于“排查搜索攻略功能异常”。

```md
请排查 `旅迹地图 / Voyage Atlas` 中“搜索攻略”功能的问题。

排查时请优先沿着下面链路逐层确认：

1. 入口是否正常触发
   - Hero 入口
   - `MarkerDetailPanel` 入口
2. `GuideSearchPanel` 状态流是否正确
   - query
   - scope
   - loading
   - error
   - selectedGuide
   - guideDocument
3. `guideSearchService` / `guideContentService` 是否命中缓存或正确调用 provider
4. `remoteGuideSearchProvider` 是否正确请求：
   - `/api/guides/search`
   - `/api/guides/document`
5. `server/guideApiServer.mjs` 是否正确返回结构
6. 是否是 IndexedDB 缓存、历史记录、TTL 或 schema 导致的问题

请输出：

1. 你确认过的链路
2. 根因判断
3. 最小修复方案
4. 验证方式
```

## 6. 推荐搭配

如果是继续开发或排查，建议同时参考以下文档：

- [docs/guide-search-feature.md](./guide-search-feature.md)
- [docs/guide-search-api-contract.md](./guide-search-api-contract.md)
- [docs/travel-guide-search-design.md](./travel-guide-search-design.md)
- [docs/project-overview.md](./project-overview.md)

## 7. 细化版本

如果你希望直接按职责拆分使用，可继续使用这两份细化版：

- 前端实现版：[docs/guide-search-frontend-prompt.md](./guide-search-frontend-prompt.md)
- 后端 adapter 版：[docs/guide-search-adapter-prompt.md](./guide-search-adapter-prompt.md)
