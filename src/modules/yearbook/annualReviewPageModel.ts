import type { AnnualReviewMarkerDto, AnnualReviewResponseDto } from '../../lib/api/types';

export function formatAnnualReviewDate(value: string) {
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatAnnualReviewDateRange(startAt: string, endAt: string) {
  return `${formatAnnualReviewDate(startAt)} - ${formatAnnualReviewDate(endAt)}`;
}

export function formatAnnualReviewMonth(month: string) {
  return `${Number(month)}月`;
}

export function buildAnnualSummaryCards(data: AnnualReviewResponseDto) {
  return [
    { label: '旅行天数', value: data.summary.totalTravelDays, description: '按日期去重后的年度覆盖天数' },
    { label: '旅行记录', value: data.summary.totalMarkers, description: '这一年留下的足迹数量' },
    { label: '覆盖城市', value: data.summary.totalCities, description: '不同城市的累计数量' },
    { label: '覆盖地区', value: data.summary.totalRegions, description: '省份、国家或地区数量' },
    { label: '年度照片', value: data.summary.photoCount, description: '记录中关联的照片数量' },
    { label: '关联攻略', value: data.summary.guideCount, description: '这一年沉淀的攻略素材' },
  ];
}

export function buildAnnualHighlightItems(data: AnnualReviewResponseDto) {
  return [
    data.tripHighlights.longestTrip
      ? {
          label: '最长行程',
          value: data.tripHighlights.longestTrip.tripName,
          description: `${data.tripHighlights.longestTrip.days} 天`,
        }
      : null,
    data.tripHighlights.busiestMonth
      ? {
          label: '最活跃月份',
          value: formatAnnualReviewMonth(data.tripHighlights.busiestMonth.month),
          description: `${data.tripHighlights.busiestMonth.markerCount} 条记录`,
        }
      : null,
    data.tripHighlights.topCompanion
      ? {
          label: '最常同行',
          value: data.tripHighlights.topCompanion.companionName,
          description: `${data.tripHighlights.topCompanion.travelDays} 天`,
        }
      : null,
    data.tripHighlights.topRegion
      ? {
          label: '最常去地区',
          value: data.tripHighlights.topRegion.scopeName,
          description: `${data.tripHighlights.topRegion.markerCount} 条记录`,
        }
      : null,
    data.tripHighlights.topCity
      ? {
          label: '最常去城市',
          value: data.tripHighlights.topCity.city,
          description: `${data.tripHighlights.topCity.markerCount} 条记录`,
        }
      : null,
  ].filter((item): item is { label: string; value: string; description: string } => item !== null);
}

export function buildMarkerCaption(marker?: AnnualReviewMarkerDto) {
  if (!marker) {
    return '暂无记录';
  }
  return `${formatAnnualReviewDateRange(marker.visitedStartAt, marker.visitedEndAt)} · ${marker.scopeName} · ${marker.city}`;
}
