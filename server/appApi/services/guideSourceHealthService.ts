import { getPrismaClient } from '../prisma.js';
import { listGuideSourceHealthSnapshot } from '../repositories/guideSourceHealthRepository.js';
import type { ListGuideSourceHealthQuery } from '../schemas/guideSourceHealth.js';
import { serializeGuideSourceHealthList } from '../serializers/adminSerializer.js';

export async function listGuideSourceHealthResource(query: ListGuideSourceHealthQuery) {
  const prisma = getPrismaClient();
  const items = await listGuideSourceHealthSnapshot(prisma, query.limit ?? 20);
  return serializeGuideSourceHealthList(items);
}
