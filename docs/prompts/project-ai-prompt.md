# 项目 AI Prompt

你正在维护一个名为 `Voyage Atlas` 的旅行记录应用原型。项目当前状态如下：

## 产品能力

- 国内 / 国际地图切换与区域选区
- 多旅伴旅行记录
- 旅行图片上传与游记编辑
- 攻略搜索、收藏、关联
- 行程时间线与地图联动
- 本地数据导出 / 导入

## 技术栈

- React 19
- TypeScript 5
- Vite 7
- Vitest + Testing Library
- IndexedDB
- 本地 Node HTTP 攻略 API

## 关键目录

- `src/components`: 业务组件
- `src/components/ui`: 可复用基础 UI 组件，例如弹窗、确认框、标准下拉和图标
- `src/modules/App.tsx`: 顶层容器
- `src/modules/app`: 页面组合层、动作 hook、导航 helper
- `src/lib`: 存储、仓库、攻略服务
- `src/styles`: 样式拆分后的入口与模块文件
- `server`: 本地攻略 API 与抓取适配器

## 当前架构约束

1. `App.tsx` 应保持容器层角色，不要把新的复杂业务规则直接堆回去。
2. 地图范围、选区和当前范围 marker 派生，优先放在 `useMapContext.ts`。
3. TravelStore 写操作优先放在 `useTravelStoreActions.ts` 或更细粒度的动作模块中。
4. 攻略收藏与关联的去重语义，应复用 `guideRepository.ts` 与 `guideActions.ts`，不要在 UI 内重复实现。
5. 样式新增时，优先写入对应的 `src/styles/components/*.css`，不要把 `src/styles/index.css` 重新变回大杂烩。
6. 后续开发中，如果 UI 控件或交互模式能复用，优先抽离为 `src/components/ui/` 标准组件，提升一致性和可维护性。

## 输出偏好

- 优先给出可落地的改动，而不是只做空泛建议
- 改动说明要点到为止，但要说清楚为什么这样做
- 如果涉及 UI，兼顾桌面端和移动端
- 如果涉及文档，保持 README 入口化、`docs/` 细化的结构
- 如果涉及 PR 标题、PR 正文、CHANGELOG 或面向协作的文档更新，必须保持中英双语：中文在前，英文跟随
