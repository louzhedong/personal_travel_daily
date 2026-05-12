import type {
  MemoryCapsuleBadgeConfigDto,
  MemoryCapsuleConfigDto,
  MemoryCapsuleContentDto,
  MemoryCapsulePhotoConfigDto,
  MemoryCapsuleSectionConfigDto,
} from '../../types.js';

export function buildDefaultMemoryCapsuleConfig(content: MemoryCapsuleContentDto): MemoryCapsuleConfigDto {
  const sections: MemoryCapsuleSectionConfigDto[] = content.sections.map((section, index) => ({
    id: section.id,
    enabled: section.enabled,
    sortOrder: index,
  }));
  const photos: MemoryCapsulePhotoConfigDto[] = content.photos.map((photo, index) => ({
    imageId: photo.imageId,
    sortOrder: index,
  }));
  const badges: MemoryCapsuleBadgeConfigDto[] = [...content.badges, ...content.achievements].map((badge, index) => ({
    id: badge.id,
    enabled: true,
    sortOrder: index,
  }));

  return {
    coverImageId: content.photos[0]?.imageId,
    exportPreset: 'balanced',
    sections,
    photos,
    badges,
  };
}
