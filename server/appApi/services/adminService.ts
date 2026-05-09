import { getPrismaClient } from '../prisma.js';
import { listAdminOverviewAccounts } from '../repositories/adminOverviewRepository.js';
import {
  aggregateGuideSearchStatusBreakdown,
  listRecentGuideSearchLogs,
} from '../repositories/guideSearchLogRepository.js';
import { listGuideSourceHealthSnapshot } from '../repositories/guideSourceHealthRepository.js';
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

  const overview = serializeAdminOverview(accounts);
  const guideSearchStatusBreakdown = serializeGuideSearchStatusBreakdown(statusBreakdown);
  const guideSourceHealth = serializeGuideSourceHealthSnapshot(sourceHealth);

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
