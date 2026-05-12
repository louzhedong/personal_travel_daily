import type {
  AtlasPlaceRegionDto,
  AtlasReplayItemDto,
  AtlasScopeDto,
  AtlasTimelineResponseDto,
} from '../../lib/api/types';

export const ATLAS_SCOPE_OPTIONS: Array<{ value: AtlasScopeDto; label: string }> = [
  { value: 'all', label: '全部范围' },
  { value: 'domestic', label: '国内' },
  { value: 'international', label: '国际' },
];

export function getAtlasCurrentReplayItem(replay: AtlasReplayItemDto[], index: number) {
  if (replay.length === 0) return undefined;
  return replay[Math.min(Math.max(index, 0), replay.length - 1)];
}

export function getAtlasProgressText(replay: AtlasReplayItemDto[], index: number) {
  if (replay.length === 0) return '等待第一段旅行轨迹';
  return `${Math.min(index + 1, replay.length)} / ${replay.length}`;
}

export function buildAtlasYearOptions(availableYears: string[]) {
  return [{ value: 'all', label: '全部年份' }, ...availableYears.map((year) => ({ value: year, label: `${year} 年` }))];
}

export function buildAtlasMonthOptions() {
  return [
    { value: 'all', label: '全部月份' },
    ...Array.from({ length: 12 }, (_, index) => {
      const value = String(index + 1).padStart(2, '0');
      return { value, label: `${index + 1} 月` };
    }),
  ];
}

export function buildAtlasCompanionOptions(companions: AtlasTimelineResponseDto['companions']) {
  return [{ value: 'all', label: '全部旅伴' }, ...companions.map((item) => ({ value: item.id, label: item.name }))];
}

export function buildAtlasTripOptions(trips: AtlasTimelineResponseDto['trips']) {
  return [
    { value: 'all', label: '全部行程' },
    { value: 'unassigned', label: '未归行程' },
    ...trips.map((item) => ({ value: item.id, label: item.name })),
  ];
}

export function getTopAtlasRegions(regions: AtlasPlaceRegionDto[], limit = 6) {
  return regions.slice(0, limit);
}

export function getAtlasEmptyMessage(data: AtlasTimelineResponseDto) {
  if (data.summary.markerCount > 0) return '';
  return '当前筛选下还没有旅行记录。';
}
