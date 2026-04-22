import { PrismaClient } from '@prisma/client';

declare global {
  // Reuse the Prisma client during local HMR to avoid exhausting connections.
  // eslint-disable-next-line no-var
  var __voyageAtlasPrisma__: PrismaClient | undefined;
}

export function getPrismaClient(): PrismaClient {
  if (!globalThis.__voyageAtlasPrisma__) {
    globalThis.__voyageAtlasPrisma__ = new PrismaClient();
  }

  return globalThis.__voyageAtlasPrisma__;
}
