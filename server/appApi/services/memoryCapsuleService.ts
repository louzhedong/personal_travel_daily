import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { createNotFoundError, createValidationError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import type {
  MemoryCapsuleConfigDto,
  MemoryCapsuleContentDto,
  MemoryCapsuleDetailResponseDto,
  MemoryCapsuleListResponseDto,
  MemoryCapsuleTemplateDto,
} from '../types.js';
import type {
  CreateMemoryCapsuleBody,
  ListMemoryCapsulesQuery,
  UpdateMemoryCapsuleBody,
} from '../schemas/memoryCapsules.js';
import {
  archiveMemoryCapsule as archiveMemoryCapsuleRecord,
  createMemoryCapsule,
  findMemoryCapsuleById,
  listMemoryCapsules,
  updateMemoryCapsule,
} from '../repositories/memoryCapsuleRepository.js';
import { buildDefaultMemoryCapsuleConfig } from './memoryCapsules/defaultConfig.js';
import { applyMemoryCapsuleConfig } from './memoryCapsules/applyConfig.js';
import { composeAnnualCapsule } from './memoryCapsules/composeAnnualCapsule.js';
import { composeCompanionCapsule } from './memoryCapsules/composeCompanionCapsule.js';
import { composeTripCapsule } from './memoryCapsules/composeTripCapsule.js';
import {
  normalizeMemoryCapsuleConfig,
  serializeMemoryCapsuleDetail,
  serializeMemoryCapsuleSummary,
} from '../serializers/memoryCapsuleSerializer.js';

function assertAnnualTarget(targetId: string) {
  if (!/^\d{4}$/.test(targetId)) {
    throw createValidationError('annual capsule targetId must be a four-digit year');
  }
}

async function composeCapsuleContent(
  account: AuthenticatedAccount,
  type: 'trip' | 'annual' | 'companion',
  targetId: string,
): Promise<MemoryCapsuleContentDto> {
  if (type === 'trip') {
    return composeTripCapsule(account.id, targetId);
  }
  if (type === 'annual') {
    assertAnnualTarget(targetId);
    return composeAnnualCapsule(account, targetId);
  }
  return composeCompanionCapsule(account.id, targetId);
}

function getFallbackTitle(type: 'trip' | 'annual' | 'companion', content: MemoryCapsuleContentDto) {
  if (type === 'trip') return content.hero.title;
  if (type === 'annual') return content.hero.title;
  return content.hero.title;
}

async function getCapsuleOrThrow(prisma: Prisma.TransactionClient, accountId: string, capsuleId: string) {
  const capsule = await findMemoryCapsuleById(prisma, accountId, capsuleId);
  if (!capsule) {
    throw createNotFoundError('memory capsule not found');
  }
  return capsule;
}

export async function listAccountMemoryCapsules(
  account: AuthenticatedAccount,
  query: ListMemoryCapsulesQuery,
): Promise<MemoryCapsuleListResponseDto> {
  const prisma = getPrismaClient();
  const capsules = await listMemoryCapsules(prisma, account.id, query.includeArchived);
  const summaries = await Promise.all(
    capsules.map(async (capsule) => {
      try {
        const content = await composeCapsuleContent(account, capsule.type, capsule.targetId);
        const config = normalizeMemoryCapsuleConfig(capsule.configJson, content);
        return serializeMemoryCapsuleSummary(capsule, applyMemoryCapsuleConfig(content, config));
      } catch {
        return serializeMemoryCapsuleSummary(capsule);
      }
    }),
  );
  return { capsules: summaries };
}

export async function createAccountMemoryCapsule(
  account: AuthenticatedAccount,
  input: CreateMemoryCapsuleBody,
): Promise<MemoryCapsuleDetailResponseDto> {
  const prisma = getPrismaClient();
  const content = await composeCapsuleContent(account, input.type, input.targetId);
  const config = buildDefaultMemoryCapsuleConfig(content);
  const title = input.title ?? getFallbackTitle(input.type, content);
  const capsule = await createMemoryCapsule(prisma, {
    id: randomUUID(),
    accountId: account.id,
    type: input.type,
    targetId: input.targetId,
    title,
    subtitle: input.subtitle,
    template: input.template ?? 'editorial',
    configJson: config as unknown as Prisma.InputJsonValue,
  });
  const appliedContent = applyMemoryCapsuleConfig(
    { ...content, hero: { ...content.hero, title, subtitle: input.subtitle ?? content.hero.subtitle } },
    config,
  );
  return { capsule: serializeMemoryCapsuleDetail(capsule, config, appliedContent) };
}

export async function getAccountMemoryCapsule(
  account: AuthenticatedAccount,
  capsuleId: string,
): Promise<MemoryCapsuleDetailResponseDto> {
  const prisma = getPrismaClient();
  const capsule = await getCapsuleOrThrow(prisma, account.id, capsuleId);
  const content = await composeCapsuleContent(account, capsule.type, capsule.targetId);
  const config = normalizeMemoryCapsuleConfig(capsule.configJson, content);
  const appliedContent = applyMemoryCapsuleConfig(
    {
      ...content,
      hero: {
        ...content.hero,
        title: capsule.title,
        subtitle: capsule.subtitle ?? content.hero.subtitle,
      },
    },
    config,
  );
  return { capsule: serializeMemoryCapsuleDetail(capsule, config, appliedContent) };
}

export async function updateAccountMemoryCapsule(
  account: AuthenticatedAccount,
  capsuleId: string,
  input: UpdateMemoryCapsuleBody,
): Promise<MemoryCapsuleDetailResponseDto> {
  const prisma = getPrismaClient();
  const current = await getCapsuleOrThrow(prisma, account.id, capsuleId);
  const updated = await updateMemoryCapsule(prisma, current.id, {
    title: input.title,
    subtitle: input.subtitle,
    template: input.template,
    status: input.status,
    configJson: input.config as unknown as Prisma.InputJsonValue | undefined,
  });
  return getAccountMemoryCapsule(account, updated.id);
}

export async function duplicateAccountMemoryCapsule(
  account: AuthenticatedAccount,
  capsuleId: string,
): Promise<MemoryCapsuleDetailResponseDto> {
  const prisma = getPrismaClient();
  const current = await getCapsuleOrThrow(prisma, account.id, capsuleId);
  const duplicate = await createMemoryCapsule(prisma, {
    id: randomUUID(),
    accountId: account.id,
    type: current.type,
    targetId: current.targetId,
    title: `${current.title} 副本`,
    subtitle: current.subtitle ?? undefined,
    template: current.template as MemoryCapsuleTemplateDto,
    configJson: current.configJson as Prisma.InputJsonValue,
  });
  return getAccountMemoryCapsule(account, duplicate.id);
}

export async function archiveAccountMemoryCapsule(account: AuthenticatedAccount, capsuleId: string) {
  const prisma = getPrismaClient();
  const current = await getCapsuleOrThrow(prisma, account.id, capsuleId);
  await archiveMemoryCapsuleRecord(prisma, current.id, new Date());
  return { success: true };
}
