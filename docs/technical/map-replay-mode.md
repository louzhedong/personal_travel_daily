# 地图回放模式 / Map Replay Mode

## 概览 / Overview

地图回放模式为首页地图卡片增加了一条本地前端驱动的“旅行回看”能力。

The map replay mode adds a frontend-only “travel retrospective” workflow to the homepage map card.

它的目标不是替代时间线，而是把地图、区域高亮、旅途轨迹和当前旅伴的记录串成一个连续、可播放、可手动步进的空间叙事。

Its goal is not to replace the timeline, but to connect the map, region highlighting, journey arcs, and the active companion’s records into a continuous spatial story that can be played or stepped manually.

## 用户体验 / User Experience

### 入口 / Entry

- 回放控件内嵌在首页现有地图卡片底部。
- 控件包含：上一步、播放/暂停、下一步、结束、速度选择和当前进度文案。
- 播放中的当前地点会以一个移动圆点和极短地点文字显示在地图上。

- The replay controls are embedded at the bottom of the existing homepage map card.
- The controls include previous, play/pause, next, end, speed selection, and current progress text.
- The currently active stop is rendered on the map as a moving dot with a very short place label.

### 回放范围 / Replay Scope

- 只回放当前旅伴的记录。
- 国内地图只回放国内记录。
- 世界地图会同时接入国内和国际记录，并把国内城市自动归属到“中国”。
- 世界地图回放不依赖用户先手动选中国家。

- Only records belonging to the current companion are replayed.
- The domestic map replays only domestic records.
- The world map uses both domestic and international records, and automatically collapses domestic city records into `中国 / China`.
- World-map replay does not require the user to pre-select a country filter.

### 动画规则 / Animation Rules

- 自动播放和手动步进都会沿两地之间的旅途曲线移动。
- 手动上一步/下一步时，会临时显示两地之间的过渡轨迹；动画完成后自动隐藏。
- 播放时会自动打开旅途轨迹显示。
- 结束播放会退出回放态并清空当前移动标签。

- Both autoplay and manual stepping move along the journey arc between the two locations.
- Manual previous/next temporarily reveals the transition arc between the two points and hides it again after the motion finishes.
- Starting playback automatically enables the journey-line layer.
- Ending playback exits replay mode and clears the active moving marker.

## 世界地图归属规则 / World Map Mapping Rules

### 设计原则 / Design Principle

世界地图的核心语义是“国家之间的移动”，不是“先选中国家再开始回放”。

The primary semantic unit of the world map is movement between countries, not “select a country first and then start replay.”

因此：

Therefore:

- `云南 -> 东京` 会在世界地图中表现为 `中国 -> 日本`
- `北京 -> 首尔` 会在世界地图中表现为 `中国 -> 韩国`
- `巴黎 -> 罗马` 会在世界地图中表现为 `法国 -> 意大利`

- `Yunnan -> Tokyo` is represented as `China -> Japan` on the world map.
- `Beijing -> Seoul` is represented as `China -> Korea` on the world map.
- `Paris -> Rome` is represented as `France -> Italy` on the world map.

### 实现方式 / Implementation

- `src/lib/mapRegionResolver.ts` 负责把记录解析成当前地图语义下的区域 ID。
- 在世界地图下，国内记录统一映射到 `中国 / China`。
- 国际记录通过 `scopeId` 前缀解析到目标国家。
- 回放和旅途轨迹都共享这套映射逻辑，避免两套行为不一致。

- `src/lib/mapRegionResolver.ts` resolves each marker into the region ID required by the current map scope.
- On the world map, domestic markers are always mapped to `中国 / China`.
- International markers are mapped to their country via the `scopeId` prefix.
- Replay and journey arcs share the same mapping logic so the two layers stay consistent.

## 状态与数据流 / State and Data Flow

### 主要状态 / Primary State

`TravelMap` 内部维护以下回放状态：

`TravelMap` maintains the following replay state:

- `replayIndex`: 当前回放项索引
- `replayPlaying`: 是否处于自动播放
- `replayStarted`: 是否已经进入回放态
- `replaySpeedMs`: 当前播放速度
- `replayTagPosition`: 地图上移动标签的实时坐标
- `replayMotionFromIndex`: 本次动画的起点索引
- `replayManualTransitionVisible`: 手动步进时是否显示过渡轨迹

- `replayIndex`: current replay item index
- `replayPlaying`: whether autoplay is active
- `replayStarted`: whether the UI is currently in replay mode
- `replaySpeedMs`: current playback speed
- `replayTagPosition`: live position of the moving map marker
- `replayMotionFromIndex`: source index for the current animation
- `replayManualTransitionVisible`: whether a temporary transition arc is visible during manual stepping

### 纯逻辑模块 / Pure Logic Modules

- `src/lib/mapReplay.ts`
  - 生成排序后的回放序列
  - 统一回放状态文案
- `src/lib/mapJourneyArcs.ts`
  - 生成旅途轨迹曲线与箭头
- `src/lib/mapRegionResolver.ts`
  - 统一国内/国际记录在不同地图视角下的区域归属

- `src/lib/mapReplay.ts`
  - builds the ordered replay sequence
  - centralizes replay status text
- `src/lib/mapJourneyArcs.ts`
  - builds journey arcs and arrowheads
- `src/lib/mapRegionResolver.ts`
  - centralizes region mapping for domestic/international markers under different map scopes

## UI 结构 / UI Structure

### 回放面板 / Replay Panel

- 放在地图左下角
- 桌面端使用有限宽度，避免和右下角颜色说明卡抢空间
- 移动端恢复为整段铺开

- Anchored to the lower-left corner of the map
- Uses a bounded width on desktop so it does not compete with the lower-right legend card
- Falls back to full-width behavior on mobile

### 速度选择器 / Speed Selector

- 复用项目标准组件 `FancySelect`
- 为地图回放单独提供紧凑尺寸样式
- 下拉菜单通过 portal 渲染，避免被地图容器裁剪或层级遮挡

- Reuses the project-standard `FancySelect`
- Uses a replay-specific compact size variant
- Renders the dropdown menu through a portal so it is not clipped by the map container or hidden by stacking context

## 测试覆盖 / Test Coverage

`src/components/__tests__/TravelMap.spec.tsx` 当前覆盖了以下回放行为：

`src/components/__tests__/TravelMap.spec.tsx` currently covers the following replay behaviors:

- 默认态下不显示回放标签
- 播放后展示当前项和进度文案
- 手动前进/后退可以切换当前项
- 手动切换时会出现过渡轨迹
- 记录不足两条时禁用播放
- 世界地图下不会因为当前选中国家而错误过滤回放序列
- 国内记录会在世界地图上聚合到中国

- the replay tag is hidden in the idle state
- playback shows the active item and progress text
- manual next/previous switches the current replay item
- manual stepping shows a temporary transition arc
- replay is disabled when fewer than two records are available
- the world-map replay is not incorrectly filtered by the currently selected country
- domestic markers aggregate into China on the world map

## 已知边界 / Known Boundaries

- 当前回放状态是纯前端本地状态，不做持久化。
- 世界地图回放是国家级语义，不在世界地图上保留国内省份级细分。
- 当前没有提供“拖动时间轴到某一天”的专用控制器，仍以播放和步进为主。

- Replay state is currently frontend-local and is not persisted.
- World-map replay uses country-level semantics and does not preserve province-level detail on the world map.
- There is no dedicated scrubber for jumping to an arbitrary date yet; the current UI focuses on play and step controls.
