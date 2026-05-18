import { randomUUID } from 'node:crypto';
import { getPrismaClient } from '../prisma.js';
import {
  listGuideSourceHealthSnapshot,
  listGuideSourcePreferences,
  listLatestGuideQualitySnapshotsByDomain,
  upsertGuideSourcePreference,
} from '../repositories/guideSourceHealthRepository.js';
import type {
  ListGuideSourceHealthQuery,
  UpdateGuideSourcePreferenceBody,
} from '../schemas/guideSourceHealth.js';
import { serializeGuideSourceHealthList } from '../serializers/adminSerializer.js';

export async function listGuideSourceHealthResource(query: ListGuideSourceHealthQuery) {
  const prisma = getPrismaClient();
  const healthItems = await listGuideSourceHealthSnapshot(prisma, query.limit ?? 20);
  const domains = healthItems.map((item) => item.sourceDomain);
  const [preferences, snapshots] = await Promise.all([
    listGuideSourcePreferences(prisma),
    listLatestGuideQualitySnapshotsByDomain(prisma, domains),
  ]);
  const preferenceBySource = new Map(
    preferences.map((item) => [`${item.sourceName}:${item.sourceDomain}`, item]),
  );
  const latestSnapshotByDomain = new Map<string, (typeof snapshots)[number]>();
  for (const snapshot of snapshots) {
    if (snapshot.sourceDomain && !latestSnapshotByDomain.has(snapshot.sourceDomain)) {
      latestSnapshotByDomain.set(snapshot.sourceDomain, snapshot);
    }
  }
  const items = healthItems.map((item) => ({
    ...item,
    preference: preferenceBySource.get(`${item.sourceName}:${item.sourceDomain}`),
    qualitySnapshot: latestSnapshotByDomain.get(item.sourceDomain),
  }));
  return serializeGuideSourceHealthList(items);
}

export async function updateGuideSourcePreferenceResource(
  accountId: string,
  input: UpdateGuideSourcePreferenceBody,
) {
  const prisma = getPrismaClient();
  const sourceName = input.sourceName.trim();
  const sourceDomain = input.sourceDomain.trim().toLowerCase();
  await upsertGuideSourcePreference(prisma, {
    id: randomUUID(),
    sourceName,
    sourceDomain,
    priorityWeight: input.priorityWeight,
    demotionReason: input.demotionReason?.trim() || undefined,
    updatedBy: accountId,
  });

  const healthItems = await listGuideSourceHealthSnapshot(prisma, 50);
  const matched = healthItems.find(
    (item) => item.sourceName === sourceName && item.sourceDomain === sourceDomain,
  );
  const item = {
    ...(matched ?? {
    id: `${sourceName}:${sourceDomain}`,
    sourceName,
    sourceDomain,
    recentSuccess: 0,
    recentFailure: 0,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastFailureReason: null,
    updatedAt: new Date(),
    }),
    preference: {
      priorityWeight: input.priorityWeight,
      demotionReason: input.demotionReason?.trim() || null,
    },
    qualitySnapshot: undefined,
  };

  return {
    item: serializeGuideSourceHealthList([
      item,
    ]).items[0],
  };
}
