import type { MemoryCapsule } from '@prisma/client';
import type {
  MemoryCapsuleConfigDto,
  MemoryCapsuleContentDto,
  MemoryCapsuleDetailDto,
  MemoryCapsuleSummaryDto,
  MemoryCapsuleTemplateDto,
} from '../types.js';
import { buildDefaultMemoryCapsuleConfig } from '../services/memoryCapsules/defaultConfig.js';

export function toIsoString(value: Date) {
  return value.toISOString();
}

export function normalizeMemoryCapsuleTemplate(value: string): MemoryCapsuleTemplateDto {
  if (value === 'memoir' || value === 'postcard' || value === 'atlas') {
    return value;
  }
  return 'editorial';
}

export function normalizeMemoryCapsuleConfig(value: unknown, content: MemoryCapsuleContentDto): MemoryCapsuleConfigDto {
  if (!value || typeof value !== 'object') {
    return buildDefaultMemoryCapsuleConfig(content);
  }
  const candidate = value as Partial<MemoryCapsuleConfigDto>;
  return {
    coverImageId: typeof candidate.coverImageId === 'string' ? candidate.coverImageId : content.photos[0]?.imageId,
    accentColor: typeof candidate.accentColor === 'string' ? candidate.accentColor : undefined,
    exportPreset:
      candidate.exportPreset === 'compact' || candidate.exportPreset === 'visual' ? candidate.exportPreset : 'balanced',
    sections: Array.isArray(candidate.sections) ? candidate.sections : buildDefaultMemoryCapsuleConfig(content).sections,
    photos: Array.isArray(candidate.photos) ? candidate.photos : buildDefaultMemoryCapsuleConfig(content).photos,
    badges: Array.isArray(candidate.badges) ? candidate.badges : buildDefaultMemoryCapsuleConfig(content).badges,
  };
}

export function serializeMemoryCapsuleSummary(
  capsule: MemoryCapsule,
  content?: MemoryCapsuleContentDto,
): MemoryCapsuleSummaryDto {
  return {
    id: capsule.id,
    type: capsule.type,
    targetId: capsule.targetId,
    targetLabel: content?.hero.title ?? capsule.targetId,
    title: capsule.title,
    subtitle: capsule.subtitle ?? undefined,
    template: normalizeMemoryCapsuleTemplate(capsule.template),
    status: capsule.status,
    coverImageUrl: content?.hero.coverImageUrl,
    createdAt: toIsoString(capsule.createdAt),
    updatedAt: toIsoString(capsule.updatedAt),
  };
}

export function serializeMemoryCapsuleDetail(
  capsule: MemoryCapsule,
  config: MemoryCapsuleConfigDto,
  content: MemoryCapsuleContentDto,
): MemoryCapsuleDetailDto {
  return {
    capsule: serializeMemoryCapsuleSummary(capsule, content),
    config,
    content,
  };
}
