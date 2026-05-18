import { randomUUID } from 'node:crypto';
import { MARKER_TAGS } from '../../../shared/markerMetadata.js';
import { createNotFoundError, createValidationError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import {
  createMarkerTagVocabularyRow,
  deleteMarkerTagVocabularyRow,
  findMarkerTagVocabularyRow,
  listActiveMarkerTagPayloads,
  listMarkerTagVocabularyRows,
  type PrismaExecutor,
  updateMarkerTagVocabularyRow,
  upsertMarkerTagVocabularyRow,
} from '../repositories/tagVocabularyRepository.js';
import type {
  CreateMarkerTagVocabularyBody,
  UpdateMarkerTagVocabularyBody,
} from '../schemas/tagVocabulary.js';
import type { MarkerTagVocabularyItemDto, MarkerTagVocabularyResponseDto } from '../types.js';

const SYSTEM_TAG_LABELS: Record<string, string> = {
  food: '美食',
  hiking: '徒步',
  beach: '海边',
  museum: '博物馆',
  photography: '摄影',
  family: '亲子',
  weekend: '周末',
  business: '出差',
  nature: '自然风景',
  citywalk: '城市漫游',
};

const SYSTEM_TAG_SET = new Set<string>(MARKER_TAGS);
const TAG_VALUE_PATTERN = /^[a-z0-9][a-z0-9_-]{1,31}$/;

function slugifyTagValue(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 32);
}

function normalizeTagValue(value: string) {
  return value.trim().toLowerCase();
}

function assertValidTagValue(value: string) {
  if (!TAG_VALUE_PATTERN.test(value)) {
    throw createValidationError('tag value can only contain lowercase letters, numbers, underscore, and hyphen');
  }
}

function countMarkerTags(markers: Array<{ tags: unknown }>) {
  const counts = new Map<string, number>();
  markers.forEach((marker) => {
    if (!Array.isArray(marker.tags)) return;
    new Set(marker.tags.filter((tag): tag is string => typeof tag === 'string')).forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });
  return counts;
}

function serializeVocabulary(
  rows: Awaited<ReturnType<typeof listMarkerTagVocabularyRows>>,
  usageCounts: Map<string, number>,
): MarkerTagVocabularyResponseDto {
  const rowByValue = new Map(rows.map((row) => [row.value, row]));
  const systemItems = MARKER_TAGS.map((value, index): MarkerTagVocabularyItemDto => {
    const override = rowByValue.get(value);
    return {
      id: override?.id,
      value,
      label: override?.label ?? SYSTEM_TAG_LABELS[value] ?? value,
      source: 'system',
      isHidden: override?.isHidden ?? false,
      sortOrder: override?.sortOrder ?? index * 10,
      usageCount: usageCounts.get(value) ?? 0,
      createdAt: override?.createdAt.toISOString(),
      updatedAt: override?.updatedAt.toISOString(),
    };
  });
  const customItems = rows
    .filter((row) => !SYSTEM_TAG_SET.has(row.value))
    .map((row): MarkerTagVocabularyItemDto => ({
      id: row.id,
      value: row.value,
      label: row.label,
      source: 'custom',
      isHidden: row.isHidden,
      sortOrder: row.sortOrder,
      usageCount: usageCounts.get(row.value) ?? 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  const items = [...systemItems, ...customItems].sort((left, right) => {
    if (left.isHidden !== right.isHidden) return left.isHidden ? 1 : -1;
    if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
    return left.label.localeCompare(right.label, 'zh-CN');
  });
  return {
    items,
    visibleItems: items.filter((item) => !item.isHidden),
    systemCount: systemItems.length,
    customCount: customItems.length,
  };
}

export async function listMarkerTagVocabulary(accountId: string): Promise<MarkerTagVocabularyResponseDto> {
  const prisma = getPrismaClient();
  const [rows, markers] = await Promise.all([
    listMarkerTagVocabularyRows(prisma, accountId),
    listActiveMarkerTagPayloads(prisma, accountId),
  ]);
  return serializeVocabulary(rows, countMarkerTags(markers));
}

export async function listVisibleMarkerTagValues(accountId: string) {
  const vocabulary = await listMarkerTagVocabulary(accountId);
  return new Set(vocabulary.visibleItems.map((item) => item.value));
}

export async function assertMarkerTagsAreKnown(accountId: string, tags?: string[]) {
  if (!tags || tags.length === 0) return;
  const values = new Set(tags.map(normalizeTagValue));
  Array.from(values).forEach(assertValidTagValue);
  const vocabulary = await listMarkerTagVocabulary(accountId);
  const knownValues = new Set(vocabulary.items.map((item) => item.value));
  const unknown = Array.from(values).find((tag) => !knownValues.has(tag));
  if (unknown) {
    throw createValidationError(`unknown marker tag: ${unknown}`);
  }
}

export async function createMarkerTagVocabulary(accountId: string, input: CreateMarkerTagVocabularyBody) {
  const prisma = getPrismaClient();
  const generatedValue = slugifyTagValue(input.label) || `custom-${randomUUID().slice(0, 8)}`;
  const value = normalizeTagValue(input.value ?? generatedValue);
  assertValidTagValue(value);
  if (SYSTEM_TAG_SET.has(value)) {
    throw createValidationError('system tag already exists');
  }
  const exists = await findMarkerTagVocabularyRow(prisma, accountId, value);
  if (exists) {
    throw createValidationError('tag already exists');
  }
  await createMarkerTagVocabularyRow(prisma, {
    id: randomUUID(),
    accountId,
    value,
    label: input.label.trim(),
    source: 'custom',
    sortOrder: input.sortOrder ?? 500,
  });
  return listMarkerTagVocabulary(accountId);
}

export async function updateMarkerTagVocabulary(accountId: string, value: string, input: UpdateMarkerTagVocabularyBody) {
  const prisma = getPrismaClient();
  const normalizedValue = normalizeTagValue(value);
  assertValidTagValue(normalizedValue);
  if (SYSTEM_TAG_SET.has(normalizedValue)) {
    const defaultIndex = MARKER_TAGS.findIndex((tag) => tag === normalizedValue);
    await upsertMarkerTagVocabularyRow(prisma, accountId, normalizedValue, {
      id: randomUUID(),
      label: input.label?.trim() ?? SYSTEM_TAG_LABELS[normalizedValue] ?? normalizedValue,
      source: 'system',
      isHidden: input.isHidden ?? false,
      sortOrder: input.sortOrder ?? defaultIndex * 10,
    });
    return listMarkerTagVocabulary(accountId);
  }
  const row = await findMarkerTagVocabularyRow(prisma, accountId, normalizedValue);
  if (!row) {
    throw createNotFoundError('tag not found');
  }
  await updateMarkerTagVocabularyRow(prisma, accountId, normalizedValue, {
    ...(input.label !== undefined ? { label: input.label.trim() } : {}),
    ...(input.isHidden !== undefined ? { isHidden: input.isHidden } : {}),
    ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
  });
  return listMarkerTagVocabulary(accountId);
}

export async function deleteMarkerTagVocabulary(accountId: string, value: string) {
  const prisma = getPrismaClient();
  const normalizedValue = normalizeTagValue(value);
  if (SYSTEM_TAG_SET.has(normalizedValue)) {
    throw createValidationError('system tag cannot be deleted');
  }
  const row = await findMarkerTagVocabularyRow(prisma, accountId, normalizedValue);
  if (!row) {
    throw createNotFoundError('tag not found');
  }
  const usageCounts = countMarkerTags(await listActiveMarkerTagPayloads(prisma, accountId));
  if ((usageCounts.get(normalizedValue) ?? 0) > 0) {
    throw createValidationError('tag is still used by markers');
  }
  await deleteMarkerTagVocabularyRow(prisma, accountId, normalizedValue);
  return listMarkerTagVocabulary(accountId);
}

export async function getMarkerTagLabels(prisma: PrismaExecutor, accountId: string) {
  const rows = await listMarkerTagVocabularyRows(prisma, accountId);
  return Object.fromEntries([
    ...MARKER_TAGS.map((value) => [value, SYSTEM_TAG_LABELS[value] ?? value]),
    ...rows.map((row) => [row.value, row.label]),
  ]);
}
