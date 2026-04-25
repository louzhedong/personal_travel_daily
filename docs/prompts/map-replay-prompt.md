# Map Replay Prompt

当任务涉及地图回放、旅途轨迹、回放控制条、移动标签或世界地图下的国家级回放语义时，请优先遵循本 Prompt。

## 适用范围

- `src/components/TravelMap.tsx` 中的回放控制条
- `src/lib/mapReplay.ts`
- `src/lib/mapJourneyArcs.ts`
- `src/lib/mapRegionResolver.ts`
- 自动播放、手动步进、世界地图国家级回放

## 先看这些文档

- [地图回放模式](../technical/map-replay-mode.md)
- [未来 Roadmap](../technical/future-roadmap.md)
- [地图渲染与 Hover 性能说明](../technical/map-rendering-and-hover-performance.md)

## 关键代码入口

- `src/components/TravelMap.tsx`
- `src/lib/mapReplay.ts`
- `src/lib/mapJourneyArcs.ts`
- `src/lib/mapRegionResolver.ts`
- `src/components/__tests__/TravelMap.spec.tsx`

## 硬约束

1. 地图回放是首页地图卡片内嵌功能，不要擅自拆成独立路由。
2. 回放状态目前是前端本地状态，不做持久化。
3. 世界地图回放必须按国家级语义运行，不依赖先手动选中国家。
4. 自动播放和手动步进都要沿轨迹移动，而不是简单跳点。
5. 回放条、速度选择器、图例和缩放控件不能互相遮挡。
6. 回放和旅途轨迹必须共享区域归属逻辑，避免表现不一致。

## 执行原则

1. 回放功能优先体现“回看感”，不是再做一条缩小版时间线。
2. 控件要轻，地图要始终是主角。
3. 新增回放逻辑优先抽到 `src/lib/*` 或组件内纯派生块，避免把 JSX 继续堆重。
4. 世界地图下，城市记录要自动归属国家，例如“云南 -> 东京”应表现为“中国 -> 日本”。

## 禁止事项

- 不要把回放建立在“必须先选一个国家筛选”这种前置动作上。
- 不要使用与旅途轨迹不同的一套国家/地区映射规则。
- 不要让回放条无限变宽去挤压图例和地图。
- 不要把速度控件做成与项目标准组件割裂的临时 UI。

## 推荐改动路径

- 回放序列和文案：`src/lib/mapReplay.ts`
- 轨迹和箭头：`src/lib/mapJourneyArcs.ts`
- 区域归属：`src/lib/mapRegionResolver.ts`
- UI 与交互：`src/components/TravelMap.tsx`
- 回归测试：`src/components/__tests__/TravelMap.spec.tsx`

## 完成后检查

- 自动播放和手动步进是否都沿轨迹移动
- 世界地图下国内记录是否自动映射到中国
- 当前选中国家是否不会错误阻断世界地图回放
- 回放条和颜色说明卡是否不互相遮挡
