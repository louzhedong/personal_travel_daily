import type {
  MemoryCapsuleBadgeDto,
  MemoryCapsuleConfigDto,
  MemoryCapsuleContentDto,
  MemoryCapsuleDetailDto,
  MemoryCapsuleMetricDto,
  MemoryCapsulePhotoDto,
  MemoryCapsuleSectionConfigDto,
  MemoryCapsuleTemplateDto,
  MemoryCapsuleTypeDto,
} from '../../lib/api/types';

export const MEMORY_CAPSULE_TYPE_LABELS: Record<MemoryCapsuleTypeDto, string> = {
  trip: '行程胶囊',
  annual: '年度胶囊',
  companion: '旅伴胶囊',
};

export const MEMORY_CAPSULE_TEMPLATE_LABELS: Record<MemoryCapsuleTemplateDto, string> = {
  editorial: '杂志',
  memoir: '纪念册',
  postcard: '明信片',
  atlas: '地图集',
};

export function summarizeCapsuleMetrics(metrics: MemoryCapsuleMetricDto[]) {
  return metrics.slice(0, 4);
}

export function getCapsuleCover(content: MemoryCapsuleContentDto) {
  return content.hero.coverImageUrl ?? content.photos[0]?.imageUrl;
}

export function getVisibleCapsulePhotos(content: MemoryCapsuleContentDto, limit = 8): MemoryCapsulePhotoDto[] {
  return content.photos.filter((photo) => !photo.hidden).slice(0, limit);
}

export function getEnabledCapsuleBadges(content: MemoryCapsuleContentDto, limit = 6): MemoryCapsuleBadgeDto[] {
  return [...content.badges, ...content.achievements].slice(0, limit);
}

export function moveSectionConfig(
  sections: MemoryCapsuleSectionConfigDto[],
  sectionId: string,
  direction: 'up' | 'down',
): MemoryCapsuleSectionConfigDto[] {
  const sorted = [...sections].sort((left, right) => left.sortOrder - right.sortOrder);
  const index = sorted.findIndex((section) => section.id === sectionId);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) {
    return sections;
  }
  const next = [...sorted];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next.map((section, sortOrder) => ({ ...section, sortOrder }));
}

export function buildUpdatedCapsuleConfig(
  current: MemoryCapsuleConfigDto,
  patch: Partial<MemoryCapsuleConfigDto>,
): MemoryCapsuleConfigDto {
  return {
    ...current,
    ...patch,
    sections: patch.sections ?? current.sections,
    photos: patch.photos ?? current.photos,
    badges: patch.badges ?? current.badges,
  };
}

export function getCapsulePrintTitle(detail: MemoryCapsuleDetailDto) {
  return `${detail.capsule.title} · 旅行胶囊`;
}
