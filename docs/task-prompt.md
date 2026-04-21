# Task Prompt

你正在为 `旅迹地图 / Voyage Atlas` 项目实现一个具体任务。

请在开始前先基于以下上下文理解项目，再给出方案并实施。

## 项目背景

这是一个旅行记录产品原型，不是后台管理系统。

产品重点包括：

- 地图足迹
- 旅行相册
- 多人 / 旅伴记录
- 时间线轨迹
- 攻略搜索、收藏与记录关联
- 品牌化旅行体验

## 技术背景

- React 19 + TypeScript + Vite 7
- SVG + `d3-geo` 地图渲染
- IndexedDB repository 持久化
- ImgBB 图片上传
- 本地 `guide-api` 服务 + provider 抽象
- Vitest + Testing Library

## 当前数据模型

```ts
type Scope = 'domestic' | 'international';

interface UserProfile {
  id: string;
  name: string;
  color: string;
}

interface VisitMarker {
  id: string;
  userId: string;
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  note: string;
  imageUrls?: string[];
  visitedStartAt: string;
  visitedEndAt: string;
  createdAt: string;
}

interface TravelStore {
  users: UserProfile[];
  markers: VisitMarker[];
  activeUserId: string;
  savedGuides: SavedGuide[];
  guideSearchHistory: GuideSearchHistoryItem[];
}
```

## 当前架构重点

- `App.tsx`
  - 页面主状态入口
- `TravelMap.tsx`
  - 地图绘制、hover、点击、缩放、轨迹
- `MarkerForm.tsx`
  - 旅行记录录入
- `MarkerList.tsx`
  - 记录展示
- `GuideSearchPanel.tsx`
  - 攻略搜索面板、结果列表、正文片段、收藏 / 关联动作
- `UserManager.tsx`
  - 旅伴管理
- `SavedGuidesPanel.tsx`
  - 当前用户的攻略收藏侧栏
- `travelStoreRepository.ts`
  - IndexedDB repository
- `guideRepository.ts`
  - 搜索历史、搜索缓存、正文缓存、收藏相关读写
- `guideSearchService.ts`
  - 攻略搜索服务入口
- `guideContentService.ts`
  - 攻略正文片段服务入口
- `storage.ts`
  - 数据归一化、迁移、domain helper

## 任务执行要求

当我提出一个具体需求时，请按以下方式工作：

1. 先判断这个需求主要影响哪个模块
2. 说明你理解到的现状
3. 给出最小可行改动方案
4. 如果改动涉及：
   - 存储：说明 schema / migration 影响
   - 地图：说明缩放 / hover / tooltip 影响
   - UI：说明是否符合当前品牌风格
   - 攻略搜索：说明入口、provider、缓存、接口合同是否受影响
   - 收藏 / 关联：说明权限边界、归属约束、去重规则是否受影响
5. 修改后运行必要验证：
   - `npm run test`
   - `npm run build`

## 具体任务模板

当我给出新需求时，请按这个格式思考：

### 任务目标

- 这个需求要解决什么问题

### 影响范围

- 哪些文件 / 模块会受影响

### 实施方案

- 最小改动方案是什么
- 是否需要新增状态 / 数据结构 / 样式 / 测试
- 如果是攻略搜索功能：
  - 优先说明是前端面板改动、provider 改动、服务端接口改动，还是文档 / prompt 改动

### 风险点

- 是否影响已有交互
- 是否影响存储兼容性
- 是否影响地图性能
- 是否影响攻略搜索历史、缓存命中或远程接口兼容性
- 是否引入收藏 / 关联语义分叉

### 验证

- 运行哪些命令
- 观察哪些行为
- 如果是攻略搜索：
  - 观察 Hero 入口、详情面板入口、搜索结果、正文片段、错误态是否正常

## 输出要求

当你真正开始写代码时，请遵循：

- 优先复用现有模块和命名
- 保持样式集中在 `src/styles/index.css`
- 测试只补必要覆盖，避免低价值测试
- 不要无故改动无关文件
- 如果有现成文档，优先同步更新 `README.md` 和 `docs/guide-search-feature.md`
- 如果涉及权限、归属或去重规则，优先同步更新 `docs/travel-guide-search-design.md`

## 示例任务说明

如果任务是：

- “新增地图轨迹方向箭头”
- “优化旅伴管理模块视觉”
- “把存储拆成 repository 层”

你都应该先把需求映射到已有模块，再做增量实现，而不是另起炉灶。
