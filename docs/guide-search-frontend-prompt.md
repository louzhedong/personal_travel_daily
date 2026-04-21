# 攻略搜索前端实现 Prompt

本文档提供一组专门面向“搜索攻略”前端实现的 prompt，适合直接复制给 AI，用于继续开发 `GuideSearchPanel`、前端 service / provider、缓存与交互体验。

## 1. 适用范围

这套 prompt 主要适用于以下工作：

- 新增或调整攻略搜索入口
- 优化 `GuideSearchPanel` 交互和样式
- 调整前端搜索状态流
- 修改 `guideSearchService` / `guideContentService`
- 修改前端 provider
- 调整搜索历史、搜索缓存、正文缓存
- 补前端测试、文档和实现说明

不适用于：

- 新增或修改服务端 adapter 抓取逻辑
- 调整 `server/guideApiServer.mjs` 的聚合策略
- 处理服务端缓存落盘、抓取规则、HTML 解析规则

## 2. 前端上下文 Prompt

```md
你正在维护 `旅迹地图 / Voyage Atlas` 项目中的“搜索攻略”前端功能。

请基于当前仓库已有实现继续工作，而不是重新设计一套前端架构。

当前前端已知实现如下：

- 首页 Hero 区有 `搜索旅游攻略` 入口
- `MarkerDetailPanel` 中有 `查找攻略` 入口
- 攻略搜索面板由 `src/components/GuideSearchPanel.tsx` 承载
- `src/modules/App.tsx` 负责控制面板开关、初始 query 和 scope
- 前端搜索服务分层如下：
  - `src/lib/guides/guideSearchService.ts`
  - `src/lib/guides/guideContentService.ts`
  - `src/lib/guides/providers/mockGuideSearchProvider.ts`
  - `src/lib/guides/providers/remoteGuideSearchProvider.ts`
- 本地仓储由 `src/lib/repositories/guideRepository.ts` 管理
- IndexedDB 中已有：
  - `savedGuides`
  - `guideSearchHistory`
  - `guideSearchCache`
  - `guideDocumentCache`
- 当前已支持：
  - 关键词搜索
  - `all / domestic / international` 范围切换
  - 最近搜索词
  - 结果卡片展示
  - 正文片段查看
  - 原始来源跳转
  - 独立收藏
  - 记录关联
  - `SavedGuidesPanel` 收藏侧栏

前端工作要求：

1. 先阅读当前实现，再做增量改动
2. 不要粗暴重写 `GuideSearchPanel`
3. 保持当前旅行品牌感和抽屉式交互语言
4. 优先复用现有 service / provider / repository 分层
5. 如果涉及缓存、搜索历史或数据结构，明确说明影响
6. 如果涉及收藏 / 关联，明确说明权限边界和 identity 规则
7. 修改后给出必要验证结果
```

## 3. 前端开发 Prompt

```md
请继续完善 `旅迹地图 / Voyage Atlas` 的“搜索攻略”前端实现。

开始前请先阅读并理解以下文件：

- `src/modules/App.tsx`
- `src/components/GuideSearchPanel.tsx`
- `src/components/MarkerDetailPanel.tsx`
- `src/lib/guides/guideSearchService.ts`
- `src/lib/guides/guideContentService.ts`
- `src/lib/guides/providers/mockGuideSearchProvider.ts`
- `src/lib/guides/providers/remoteGuideSearchProvider.ts`
- `src/lib/repositories/guideRepository.ts`
- `src/types.ts`
- `src/styles/index.css`

然后按以下要求工作：

1. 先说明当前前端已实现到什么程度
2. 识别这次需求主要落在哪一层：
   - 入口层
   - 面板层
   - service 层
   - provider 层
   - repository / 缓存层
   - 样式层
3. 给出最小可行改动方案
4. 再实施修改

实现约束：

- 不要把它做成后台搜索页
- 继续保持 `GuideSearchPanel` 像旅行内容抽屉，而不是检索工具
- 如果改收藏 / 关联逻辑，优先把身份判定收敛到 repository helper，而不是在组件里重复维护
- 尽量复用现有 state 字段：
  - `query`
  - `scope`
  - `items`
  - `history`
  - `loading`
  - `error`
  - `selectedGuide`
  - `guideDocument`
- 如需改缓存，说明是否影响：
  - 搜索结果 TTL
  - 正文缓存 TTL
  - 搜索历史读取逻辑
- 如需改 provider，说明是否影响：
  - `mock`
  - `remote`
  - `/api/guides/search`
  - `/api/guides/document`
- 如需改收藏 / 关联，说明是否影响：
  - `SavedGuidesPanel`
  - `MarkerDetailPanel` 中的相关攻略区域
  - `savedGuides` 的去重或排序语义
- 补最小必要测试

输出时请使用以下结构：

1. 当前现状
2. 影响范围
3. 实施方案
4. 风险点
5. 验证结果
```

## 4. 前端 UI 优化 Prompt

```md
请优化 `旅迹地图 / Voyage Atlas` 的“搜索攻略”前端体验。

优化对象包括：

- Hero 入口与详情入口的衔接
- `GuideSearchPanel` 顶部搜索区
- 筛选 chips
- 搜索结果卡片
- 正文片段区
- 空状态 / 错误态 / 加载态

请遵循以下约束：

- 它应该像“目的地探索面板”而不是“搜索工具箱”
- 保持与 `MarkerDetailPanel` 相近的抽屉式视觉语言
- 用背景层次和品牌色建立结构，少用重边框
- 不要引入重后台风格的筛选器、表格或管理控件
- 优先强化：
  - 目的地感
  - 来源感
  - 内容感
  - 旅行灵感感

请先说明：

1. 当前前端界面的主要问题
2. 你会如何调整内容层次
3. 为什么这些变化仍符合项目现有视觉系统

然后再实施修改。
```

## 5. 前端排查 Prompt

```md
请排查 `旅迹地图 / Voyage Atlas` 中“搜索攻略”前端链路的问题。

请按以下顺序排查：

1. 入口层
   - Hero 按钮是否能打开面板
   - `MarkerDetailPanel` 是否能带入正确 query 和 scope
2. 面板状态流
   - `query`
   - `scope`
   - `loading`
   - `error`
   - `searchedKeyword`
   - `selectedGuide`
   - `guideDocument`
3. service 层
   - `guideSearchService` 是否命中搜索缓存
   - `guideContentService` 是否命中文档缓存
4. provider 层
   - `mock` provider 是否返回预期结构
   - `remote` provider 是否正确请求接口
5. repository 层
   - 搜索历史是否正常写入 / 读取
   - TTL 是否导致缓存异常
   - IndexedDB key 是否构造正确

请输出：

1. 已确认的链路
2. 根因判断
3. 最小修复方案
4. 验证方式
```

## 6. 前端文档 Prompt

```md
请补充 `旅迹地图 / Voyage Atlas` 中“搜索攻略”功能的前端实现文档。

文档应重点说明：

- 前端入口
- `GuideSearchPanel` 职责
- `App.tsx` 如何控制打开方式
- `guideSearchService` / `guideContentService` 分工
- `mock` / `remote` provider 区别
- `guideRepository` 的缓存与历史记录逻辑
- 当前前端已实现能力
- 当前前端尚未开放能力
- 相关测试覆盖

请优先同步：

- `docs/guide-search-feature.md`
- `docs/guide-search-prompt.md`
- `README.md`
```

## 7. 推荐参考文件

- [src/modules/App.tsx](../src/modules/App.tsx)
- [src/components/GuideSearchPanel.tsx](../src/components/GuideSearchPanel.tsx)
- [src/components/MarkerDetailPanel.tsx](../src/components/MarkerDetailPanel.tsx)
- [src/components/SavedGuidesPanel.tsx](../src/components/SavedGuidesPanel.tsx)
- [src/lib/guides/guideSearchService.ts](../src/lib/guides/guideSearchService.ts)
- [src/lib/guides/guideContentService.ts](../src/lib/guides/guideContentService.ts)
- [src/lib/guides/providers/remoteGuideSearchProvider.ts](../src/lib/guides/providers/remoteGuideSearchProvider.ts)
- [src/lib/repositories/guideRepository.ts](../src/lib/repositories/guideRepository.ts)
- [src/styles/index.css](../src/styles/index.css)
- [docs/travel-guide-search-design.md](./travel-guide-search-design.md)
