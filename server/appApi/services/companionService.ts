import { randomUUID } from 'node:crypto';
import { createConflictError, createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type { CreateCompanionBody, UpdateCompanionBody } from '../schemas/companions.js';
import {
  createCompanion,
  findActiveCompanionById,
  getNextCompanionSortOrder,
  updateCompanion,
} from '../repositories/travelCompanionRepository.js';
import { buildCurrentStoreSnapshot } from './storeSnapshotService.js';

export async function createCompanionRecord(accountId: string, input: CreateCompanionBody) {
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.travelCompanion.findFirst({
      where: {
        accountId,
        isDeleted: false,
        name: input.name,
      },
    });

    if (existing) {
      throw createConflictError('companion name already exists');
    }

    const sortOrder = await getNextCompanionSortOrder(tx, accountId);
    await createCompanion(tx, {
      id: randomUUID(),
      accountId,
      name: input.name,
      color: input.color,
      sortOrder,
    });
  });

  return buildCurrentStoreSnapshot(accountId);
}

export async function updateCompanionRecord(
  accountId: string,
  companionId: string,
  input: UpdateCompanionBody,
) {
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    const current = await findActiveCompanionById(tx, accountId, companionId);

    if (!current) {
      throw createNotFoundError('companion not found');
    }

    if (input.name !== undefined && input.name !== current.name) {
      const duplicate = await tx.travelCompanion.findFirst({
        where: {
          accountId,
          isDeleted: false,
          name: input.name,
          id: {
            not: companionId,
          },
        },
      });

      if (duplicate) {
        throw createConflictError('companion name already exists');
      }
    }

    await updateCompanion(tx, companionId, input);
  });

  return buildCurrentStoreSnapshot(accountId);
}
