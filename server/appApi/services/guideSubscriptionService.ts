import { randomUUID, createHash } from 'node:crypto';
import Parser from 'rss-parser';
import { getPrismaClient } from '../prisma.js';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import type { CreateGuideSubscriptionInputDto, GuideSubscriptionDto, GuideSubscriptionItemDto, GuideSubscriptionRunDto, GuideSubscriptionRunResponseDto, GuideSubscriptionsResponseDto, UpdateGuideSubscriptionInputDto } from '../types.js';

const parser = new Parser();

function serializeSubscription(item: { id: string; kind: string; title: string; keyword: string | null; sourceName: string | null; destination: string | null; rssUrl: string | null; enabled: boolean; lastRunAt: Date | null; createdAt: Date }): GuideSubscriptionDto {
  return {
    id: item.id,
    kind: item.kind as GuideSubscriptionDto['kind'],
    title: item.title,
    keyword: item.keyword ?? undefined,
    sourceName: item.sourceName ?? undefined,
    destination: item.destination ?? undefined,
    rssUrl: item.rssUrl ?? undefined,
    enabled: item.enabled,
    lastRunAt: item.lastRunAt?.toISOString(),
    createdAt: item.createdAt.toISOString(),
  };
}

function serializeItem(item: { id: string; subscriptionId: string; title: string; sourceName: string | null; sourceUrl: string; summary: string | null; publishedAt: Date | null; firstSeenAt: Date }): GuideSubscriptionItemDto {
  return {
    id: item.id,
    subscriptionId: item.subscriptionId,
    title: item.title,
    sourceName: item.sourceName ?? undefined,
    sourceUrl: item.sourceUrl,
    summary: item.summary ?? undefined,
    publishedAt: item.publishedAt?.toISOString(),
    firstSeenAt: item.firstSeenAt.toISOString(),
  };
}

function serializeRun(item: { id: string; subscriptionId: string; status: string; matchedCount: number; errorMessage: string | null; startedAt: Date; finishedAt: Date | null }): GuideSubscriptionRunDto {
  return {
    id: item.id,
    subscriptionId: item.subscriptionId,
    status: item.status as GuideSubscriptionRunDto['status'],
    matchedCount: item.matchedCount,
    errorMessage: item.errorMessage ?? undefined,
    startedAt: item.startedAt.toISOString(),
    finishedAt: item.finishedAt?.toISOString(),
  };
}

export async function listGuideSubscriptions(account: AuthenticatedAccount): Promise<GuideSubscriptionsResponseDto> {
  const prisma = getPrismaClient();
  const [subscriptions, recentItems] = await Promise.all([
    prisma.guideSubscription.findMany({ where: { accountId: account.id }, orderBy: [{ createdAt: 'desc' }] }),
    prisma.guideSubscriptionItem.findMany({ where: { subscription: { accountId: account.id } }, orderBy: [{ firstSeenAt: 'desc' }], take: 12 }),
  ]);
  return { subscriptions: subscriptions.map(serializeSubscription), recentItems: recentItems.map(serializeItem) };
}

export async function createGuideSubscription(account: AuthenticatedAccount, input: CreateGuideSubscriptionInputDto) {
  const prisma = getPrismaClient();
  const created = await prisma.guideSubscription.create({
    data: { id: randomUUID(), accountId: account.id, kind: input.kind, title: input.title, keyword: input.keyword, sourceName: input.sourceName, destination: input.destination, rssUrl: input.rssUrl },
  });
  return { subscription: serializeSubscription(created) };
}

export async function updateGuideSubscription(account: AuthenticatedAccount, id: string, input: UpdateGuideSubscriptionInputDto) {
  const prisma = getPrismaClient();
  const updated = await prisma.guideSubscription.update({ where: { id }, data: input });
  if (updated.accountId !== account.id) throw new Error('subscription not found');
  return { subscription: serializeSubscription(updated) };
}

export async function runGuideSubscription(account: AuthenticatedAccount, id: string): Promise<GuideSubscriptionRunResponseDto> {
  const prisma = getPrismaClient();
  const subscription = await prisma.guideSubscription.findFirst({ where: { id, accountId: account.id } });
  if (!subscription) throw new Error('subscription not found');
  const startedAt = new Date();
  let status: 'success' | 'partial' | 'error' = 'success';
  let errorMessage: string | undefined;
  const items: GuideSubscriptionItemDto[] = [];
  try {
    const feedItems = subscription.kind === 'rss' && subscription.rssUrl
      ? (await parser.parseURL(subscription.rssUrl)).items.slice(0, 8)
      : [{ title: subscription.title, link: `local://${subscription.kind}/${subscription.id}`, contentSnippet: subscription.keyword ?? subscription.destination ?? subscription.sourceName ?? subscription.title }];
    for (const feedItem of feedItems) {
      const sourceUrl = feedItem.link ?? `local://${subscription.id}/${feedItem.title}`;
      const sourceHash = createHash('sha256').update(sourceUrl).digest('hex');
      const created = await prisma.guideSubscriptionItem.upsert({
        where: { subscriptionId_sourceHash: { subscriptionId: subscription.id, sourceHash } },
        create: {
          id: randomUUID(),
          subscriptionId: subscription.id,
          title: feedItem.title ?? subscription.title,
          sourceName: subscription.sourceName ?? (subscription.kind === 'rss' ? 'RSS' : 'Guide Subscription'),
          sourceUrl,
          sourceHash,
          summary: feedItem.contentSnippet,
          publishedAt: feedItem.isoDate ? new Date(feedItem.isoDate) : undefined,
        },
        update: {},
      });
      items.push(serializeItem(created));
    }
  } catch (error) {
    status = 'error';
    errorMessage = error instanceof Error ? error.message : 'subscription run failed';
  }
  const finishedAt = new Date();
  const run = await prisma.guideSubscriptionRun.create({
    data: { id: randomUUID(), subscriptionId: subscription.id, status, matchedCount: items.length, errorMessage, startedAt, finishedAt },
  });
  await prisma.guideSubscription.update({ where: { id: subscription.id }, data: { lastRunAt: finishedAt } });
  return { run: serializeRun(run), items };
}
