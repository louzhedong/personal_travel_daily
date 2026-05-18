import { getPrismaClient } from '../prisma.js';
import { listAdminOverviewAccounts } from '../repositories/adminOverviewRepository.js';
import {
  aggregateGuideSearchStatusBreakdown,
  listRecentGuideSearchLogs,
} from '../repositories/guideSearchLogRepository.js';
import {
  listGuideSourceHealthSnapshot,
  listGuideSourcePreferences,
  listLatestGuideQualitySnapshotsByDomain,
} from '../repositories/guideSourceHealthRepository.js';
import { listCompanionMemorySnapshotHealth } from '../repositories/adminQualityRepository.js';
import {
  serializeAdminOverview,
  serializeGuideSearchStatusBreakdown,
  serializeGuideSearchTrends,
  serializeGuideSourceHealthSnapshot,
} from '../serializers/adminSerializer.js';
import { buildAdminQualityReport } from './admin/qualityReport.js';

// 管理后台聚合服务 / Admin overview aggregation service.
// 账号级派生聚合位于 ./admin/accountStats.ts（独立文件避免 serializer → service 循环依赖）。
// Per-account derived aggregations live in ./admin/accountStats.ts (a standalone module that
// prevents a serializer → service circular import).
export { buildAdminAccountStats } from './admin/accountStats.js';

export async function getAdminOverview() {
  const prisma = getPrismaClient();
  const createdAtGte = new Date();
  createdAtGte.setDate(createdAtGte.getDate() - 30);

  const [accounts, logs, statusBreakdown, sourceHealth, snapshotHealth] = await Promise.all([
    listAdminOverviewAccounts(prisma),
    listRecentGuideSearchLogs(prisma, { createdAtGte, limit: 500 }),
    aggregateGuideSearchStatusBreakdown(prisma, createdAtGte),
    listGuideSourceHealthSnapshot(prisma, 20),
    listCompanionMemorySnapshotHealth(prisma),
  ]);
  const [sourcePreferences, qualitySnapshots] = await Promise.all([
    listGuideSourcePreferences(prisma),
    listLatestGuideQualitySnapshotsByDomain(
      prisma,
      sourceHealth.map((item) => item.sourceDomain),
    ),
  ]);
  const preferenceBySource = new Map(
    sourcePreferences.map((item) => [`${item.sourceName}:${item.sourceDomain}`, item]),
  );
  const qualitySnapshotByDomain = new Map<string, (typeof qualitySnapshots)[number]>();
  for (const snapshot of qualitySnapshots) {
    if (snapshot.sourceDomain && !qualitySnapshotByDomain.has(snapshot.sourceDomain)) {
      qualitySnapshotByDomain.set(snapshot.sourceDomain, snapshot);
    }
  }
  const enrichedSourceHealth = sourceHealth.map((item) => ({
    ...item,
    preference: preferenceBySource.get(`${item.sourceName}:${item.sourceDomain}`),
    qualitySnapshot: qualitySnapshotByDomain.get(item.sourceDomain),
  }));

  const overview = serializeAdminOverview(accounts);
  const guideSearchStatusBreakdown = serializeGuideSearchStatusBreakdown(statusBreakdown);
  const guideSourceHealth = serializeGuideSourceHealthSnapshot(enrichedSourceHealth);

  return {
    ...overview,
    guideSearchTrends: serializeGuideSearchTrends(logs),
    guideSearchStatusBreakdown,
    guideSourceHealth,
    quality: buildAdminQualityReport({
      accounts: overview.accounts,
      statusBreakdown: guideSearchStatusBreakdown,
      sourceHealth: guideSourceHealth,
      snapshotHealth,
    }),
  };
}
