export type MemoryCapsuleTypeDto = 'trip' | 'annual' | 'companion';
export type MemoryCapsuleStatusDto = 'draft' | 'ready' | 'archived';
export type MemoryCapsuleTemplateDto = 'editorial' | 'memoir' | 'postcard' | 'atlas';
export type MemoryCapsuleExportPresetDto = 'balanced' | 'compact' | 'visual';

export interface MemoryCapsuleSectionConfigDto {
  id: string;
  enabled: boolean;
  sortOrder: number;
  titleOverride?: string;
  bodyOverride?: string;
}

export interface MemoryCapsulePhotoConfigDto {
  imageId: string;
  sortOrder: number;
  captionOverride?: string;
  hidden?: boolean;
}

export interface MemoryCapsuleBadgeConfigDto {
  id: string;
  enabled: boolean;
  labelOverride?: string;
  valueOverride?: string;
  descriptionOverride?: string;
}

export interface MemoryCapsuleConfigDto {
  coverImageId?: string;
  accentColor?: string;
  exportPreset: MemoryCapsuleExportPresetDto;
  sections: MemoryCapsuleSectionConfigDto[];
  photos: MemoryCapsulePhotoConfigDto[];
  badges: MemoryCapsuleBadgeConfigDto[];
}

export interface MemoryCapsuleMetricDto {
  label: string;
  value: string;
  description?: string;
}

export interface MemoryCapsuleBadgeDto {
  id: string;
  label: string;
  value: string;
  description: string;
}

export interface MemoryCapsulePhotoDto {
  imageId: string;
  markerId?: string;
  imageUrl: string;
  title: string;
  caption?: string;
  visitedStartAt?: string;
  hidden?: boolean;
}

export interface MemoryCapsuleTimelineItemDto {
  id: string;
  date: string;
  title: string;
  description: string;
}

export interface MemoryCapsuleGuideDto {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
}

export interface MemoryCapsuleSectionDto {
  id: string;
  title: string;
  eyebrow: string;
  body: string;
  enabled: boolean;
  sortOrder: number;
}

export interface MemoryCapsuleContentDto {
  hero: {
    eyebrow: string;
    title: string;
    subtitle?: string;
    coverImageUrl?: string;
    dateRange?: string;
  };
  metrics: MemoryCapsuleMetricDto[];
  badges: MemoryCapsuleBadgeDto[];
  sections: MemoryCapsuleSectionDto[];
  route: MemoryCapsuleTimelineItemDto[];
  timeline: MemoryCapsuleTimelineItemDto[];
  photos: MemoryCapsulePhotoDto[];
  guides: MemoryCapsuleGuideDto[];
  checklist: MemoryCapsuleTimelineItemDto[];
  achievements: MemoryCapsuleBadgeDto[];
  sourceLinks: Array<{ label: string; path: string }>;
  emptyStates: string[];
}

export interface MemoryCapsuleSummaryDto {
  id: string;
  type: MemoryCapsuleTypeDto;
  targetId: string;
  targetLabel: string;
  title: string;
  subtitle?: string;
  template: MemoryCapsuleTemplateDto;
  status: MemoryCapsuleStatusDto;
  coverImageUrl?: string;
  updatedAt: string;
  createdAt: string;
}

export interface MemoryCapsuleDetailDto {
  capsule: MemoryCapsuleSummaryDto;
  config: MemoryCapsuleConfigDto;
  content: MemoryCapsuleContentDto;
}

export interface MemoryCapsuleListResponseDto {
  capsules: MemoryCapsuleSummaryDto[];
}

export interface MemoryCapsuleDetailResponseDto {
  capsule: MemoryCapsuleDetailDto;
}
