import { ulid } from 'ulid';
import { createConflictError, createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type { CreateCompanionBody, UpdateCompanionBody } from '../schemas/companions.js';
import { ensureDefaultAppState } from './appContextService.js';
import {
  createCompanion,
  findActiveCompanionById,
  getNextCompanionSortOrder,
  updateCompanion,
} from '../repositories/travelCompanionRepository.js';
import { buildCurrentStoreSnapshot } from './storeSnapshotService.js';

export async function createCompanionRecord(input: CreateCompanionBody) {
  const prisma = getPrismaClient();

  const accountId = await prisma.$transaction(async (tx) => {
    const context = await ensureDefaultAppState(tx);
    const existing = await tx.travelCompanion.findFirst({
      where: {
        accountId: context.accountId,
        isDeleted: false,
        name: input.name,
      },
    });

    if (existing) {
      throw createConflictError('companion name already exists');
    }

    const sortOrder = await getNextCompanionSortOrder(tx, context.accountId);
    await createCompanion(tx, {
      id: ulid(),
      accountId: context.accountId,
      name: input.name,
      color: input.color,
      sortOrder,
    });

    return context.accountId;
  });

  return buildCurrentStoreSnapshot(accountId);
}

export async function updateCompanionRecord(
  companionId: string,
  input: UpdateCompanionBody,
) {
  const prisma = getPrismaClient();

  const accountId = await prisma.$transaction(async (tx) => {
    const context = await ensureDefaultAppState(tx);
    const current = await findActiveCompanionById(tx, context.accountId, companionId);

    if (!current) {
      throw createNotFoundError('companion not found');
    }

    if (input.name !== undefined && input.name !== current.name) {
      const duplicate = await tx.travelCompanion.findFirst({
        where: {
          accountId: context.accountId,
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
    return context.accountId;
  });

  return buildCurrentStoreSnapshot(accountId);
}
