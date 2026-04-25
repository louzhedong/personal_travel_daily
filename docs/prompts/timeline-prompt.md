# Timeline Prompt

当任务涉及时间线、按年份/范围筛选、时间线与地图/详情联动，或以时间为主轴回看记录时，请优先遵循本 Prompt。

## 适用范围

- `src/components/TripTimelinePanel.tsx`
- 时间线筛选
- 时间线到地图 / 记录详情 / 行程详情的跳转

## 先看这些文档

- [项目总览](../technical/project-overview.md)
- [地图回放模式](../technical/map-replay-mode.md)

## 关键代码入口

- `src/components/TripTimelinePanel.tsx`
- `src/modules/app/markerNavigation.ts`
- `src/lib/date.ts`
- `src/lib/markerSorting.ts`

## 硬约束

1. 时间线默认围绕当前活跃旅伴生成。
2. 年份和国内/国际筛选必须与地图语义保持一致。
3. 时间线点击后的地图 / 详情联动要复用现有导航 helper。
4. 时间线不是单独孤岛，任何跳转必须能回到主链路。

## 执行原则

1. 时间线优先强调时间顺序、分组清晰度和快速扫描。
2. 如果信息过多，优先通过折叠、摘要和分组解决，不要把时间线变成长表格。
3. 新增时间维度统计时，优先复用 `date.ts` 与排序工具。

## 禁止事项

- 不要在时间线组件内部手写复杂导航状态机。
- 不要把地图和时间线的筛选语义做成两套不同规则。
- 不要让时间线条目承担过重编辑职责。

## 推荐改动路径

- `src/components/TripTimelinePanel.tsx`
- `src/modules/app/markerNavigation.ts`
- `src/lib/date.ts`
- `src/lib/markerSorting.ts`

## 完成后检查

- 年份筛选和范围筛选是否正确
- 点击条目后，地图定位和详情面板是否正常
- 行程集合存在时，时间线分组是否仍正确
