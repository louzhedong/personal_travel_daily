// 管理后台派生聚合 / Admin overview derived aggregations.
// 从 adminSerializer 中迁出：根据旅伴节点数组 + 当前账号 markerSearchEvent 数量，
// 计算每个账号的统计摘要。保持 serializer 专注于"model → DTO"，并避免 serializer → service
// 的反向依赖造成循环导入。
// Extracted from adminSerializer to keep the serializer focused on model → DTO mapping and avoid a
// serializer → service circular import. Given an array of companion nodes plus the account's
// marker-search-event count, this helper returns the per-account stats summary.
import type { AdminCompanionNodeDto } from '../../types.js';

export function buildAdminAccountStats(input: {
  tripCount: number;
  companions: AdminCompanionNodeDto[];
  markerSearchEventCount: number;
}) {
  const aggregates = input.companions.reduce(
    (summary, companion) => ({
      companionCount: summary.companionCount + 1,
      markerCount: summary.markerCount + companion.markers.length,
      savedGuideCount: summary.savedGuideCount + companion.savedGuides.length,
      guideSearchHistoryCount:
        summary.guideSearchHistoryCount + companion.guideSearchHistory.length,
      planningItemCount: summary.planningItemCount + companion.planningItems.length,
      convertedPlanningItemCount:
        summary.convertedPlanningItemCount +
        companion.planningItems.filter((item) => item.status === 'converted').length,
    }),
    {
      companionCount: 0,
      markerCount: 0,
      savedGuideCount: 0,
      guideSearchHistoryCount: 0,
      planningItemCount: 0,
      convertedPlanningItemCount: 0,
    },
  );

  return {
    tripCount: input.tripCount,
    ...aggregates,
    markerSearchEventCount: input.markerSearchEventCount,
  };
}
