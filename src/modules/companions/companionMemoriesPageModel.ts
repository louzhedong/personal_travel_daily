import type {
  CompanionMemoryResponseDto,
  CompanionMemoryPhotoDto,
  CompanionMemoryYearPointDto,
} from '../../lib/api/types';

export function formatMemoryDate(value?: string) {
  if (!value) {
    return '尚未记录';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function formatMemoryDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function getPeakYear(items: CompanionMemoryYearPointDto[]) {
  return items.reduce<{ year?: string; markerCount: number }>(
    (current, item) => {
      if (item.markerCount > current.markerCount) {
        return { year: item.year, markerCount: item.markerCount };
      }
      return current;
    },
    { markerCount: 0 },
  ).year;
}

export function buildYearMemorySummary(
  item: CompanionMemoryYearPointDto,
  options: { isPeak: boolean; isLatest: boolean },
) {
  if (options.isPeak) {
    return `这一年最密集，一起留下了 ${item.markerCount} 段共同记录。`;
  }

  if (options.isLatest) {
    return `这是最近一年的共同记忆，旅行节奏还在继续展开。`;
  }

  return `这一年一起走过 ${item.travelDays} 天，也留住了 ${item.photoCount} 张照片。`;
}

export function buildMemoryKpis(data: CompanionMemoryResponseDto) {
  return [
    { label: '共同记录', value: `${data.summary.markerCount}`, hint: '段旅行记忆' },
    { label: '同行天数', value: `${data.summary.travelDays}`, hint: '天被一起点亮' },
    { label: '共同城市', value: `${data.summary.cityCount}`, hint: '座城市留下足迹' },
    { label: '精选素材', value: `${data.summary.photoCount}`, hint: '张照片可回看' },
  ];
}

export function buildColorWash(color: string, alpha = '18') {
  const normalized = color.startsWith('#') ? color : `#${color}`;
  return `${normalized}${alpha}`;
}

export function buildPhotoAlt(photo: CompanionMemoryPhotoDto, companionName: string) {
  return `${companionName} 在 ${photo.scopeName} ${photo.city} 的共同回忆照片`;
}

export function getEmptySectionText(section: 'years' | 'places' | 'themes' | 'trips' | 'photos' | 'guides') {
  const copy = {
    years: '暂无年度回忆',
    places: '暂无共同地点',
    themes: '暂无共同主题',
    trips: '暂无代表行程',
    photos: '暂无精选照片',
    guides: '暂无共同攻略',
  } satisfies Record<typeof section, string>;
  return copy[section];
}
