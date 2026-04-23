import { getPrismaClient } from '../prisma.js';
import { listAdminOverviewAccounts } from '../repositories/adminOverviewRepository.js';
import { serializeAdminOverview } from '../serializers/adminSerializer.js';

export async function getAdminOverview() {
  const prisma = getPrismaClient();
  const accounts = await listAdminOverviewAccounts(prisma);
  return serializeAdminOverview(accounts);
}
