import type { MemoryCapsuleConfigDto, MemoryCapsuleContentDto } from '../../types.js';

export function applyMemoryCapsuleConfig(
  content: MemoryCapsuleContentDto,
  config: MemoryCapsuleConfigDto,
): MemoryCapsuleContentDto {
  const sectionConfig = new Map(config.sections.map((item) => [item.id, item]));
  const photoConfig = new Map(config.photos.map((item) => [item.imageId, item]));
  const badgeConfig = new Map(config.badges.map((item) => [item.id, item]));
  const coverPhoto = config.coverImageId ? content.photos.find((photo) => photo.imageId === config.coverImageId) : undefined;

  const sections = content.sections
    .map((section, index) => {
      const override = sectionConfig.get(section.id);
      return {
        ...section,
        enabled: override?.enabled ?? section.enabled,
        sortOrder: override?.sortOrder ?? index,
        title: override?.titleOverride || section.title,
        body: override?.bodyOverride || section.body,
      };
    })
    .filter((section) => section.enabled)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  const photos = content.photos
    .map((photo, index) => {
      const override = photoConfig.get(photo.imageId);
      return {
        ...photo,
        caption: override?.captionOverride ?? photo.caption,
        hidden: override?.hidden ?? false,
        sortOrder: override?.sortOrder ?? index,
      };
    })
    .filter((photo) => !photo.hidden)
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));

  const applyBadgeOverrides = (badges: MemoryCapsuleContentDto['badges']) =>
    badges
      .map((badge) => {
        const override = badgeConfig.get(badge.id);
        return {
          ...badge,
          label: override?.labelOverride || badge.label,
          value: override?.valueOverride || badge.value,
          description: override?.descriptionOverride || badge.description,
          enabled: override?.enabled ?? true,
        };
      })
      .filter((badge) => badge.enabled)
      .map(({ enabled: _enabled, ...badge }) => badge);

  return {
    ...content,
    hero: {
      ...content.hero,
      coverImageUrl: coverPhoto?.imageUrl ?? content.hero.coverImageUrl,
    },
    sections,
    photos,
    badges: applyBadgeOverrides(content.badges),
    achievements: applyBadgeOverrides(content.achievements),
  };
}
