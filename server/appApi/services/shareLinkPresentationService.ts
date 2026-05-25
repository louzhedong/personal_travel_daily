import { randomUUID, randomBytes } from 'node:crypto';
import type { ShareLinkPresentation } from '@prisma/client';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import { createConflictError, createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type {
  ShareLinkPresentationDto,
  ShareTemplateDto,
  ShareTemplateListDto,
} from '../dto/shareLinkPresentation.js';
import type { UpsertShareLinkPresentationBody } from '../schemas/shareLinkPresentation.js';

/**
 * F4 · ShareLinkPresentation service / 公开分享 v3 呈现层服务
 * Adds template + slug + OG metadata; never replaces token-hash auth.
 * 仅做"呈现层"，不替代 token-hash 校验。
 */

const SLUG_RESERVED = new Set(['admin', 'api', 'p', 'app', 'auth', 'static', 'public']);
const TEMPLATE_LIBRARY: ShareTemplateListDto['items'] = [
  {
    template: 'magazine',
    label: '杂志风 / Magazine',
    description: '大封面 + 旅行杂志排版 / Large cover with editorial layout',
    themeColor: '#1f2937',
  },
  {
    template: 'postcard',
    label: '明信片 / Postcard',
    description: '邮戳 + 手写质感 / Stamp + handwritten feel',
    themeColor: '#a16207',
  },
  {
    template: 'minimal',
    label: '极简 / Minimal',
    description: '小标题 + 大量留白 / Tiny title with generous whitespace',
    themeColor: '#0f172a',
  },
  {
    template: 'polaroid',
    label: '宝丽来 / Polaroid',
    description: '即时影像底片框 / Instant photo frame',
    themeColor: '#0c4a6e',
  },
];

function serialize(record: ShareLinkPresentation): ShareLinkPresentationDto {
  return {
    id: record.id,
    shareLinkId: record.shareLinkId,
    template: record.template as ShareTemplateDto,
    slug: record.slug,
    ogTitle: record.ogTitle,
    ogSubtitle: record.ogSubtitle,
    ogCoverUrl: record.ogCoverUrl,
    themeColor: record.themeColor,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function ensureUniqueSlug(slug: string, excludePresentationId?: string) {
  const prisma = getPrismaClient();
  if (SLUG_RESERVED.has(slug)) {
    return `${slug}-${randomBytes(3).toString('hex')}`;
  }
  let candidate = slug;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const conflict = await prisma.shareLinkPresentation.findFirst({
      where: { slug: candidate, NOT: excludePresentationId ? { id: excludePresentationId } : undefined },
    });
    if (!conflict) return candidate;
    candidate = `${slug}-${randomBytes(3).toString('hex')}`;
  }
  throw createConflictError('slug conflict, please retry');
}

export async function listShareTemplates(): Promise<ShareTemplateListDto> {
  return { items: TEMPLATE_LIBRARY };
}

export async function getPresentationByShareLink(
  account: AuthenticatedAccount,
  shareLinkId: string,
) {
  const prisma = getPrismaClient();
  const link = await prisma.privateShareLink.findFirst({
    where: { id: shareLinkId, accountId: account.id },
    include: { presentation: true },
  });
  if (!link) throw createNotFoundError('share link not found');
  return link.presentation ? serialize(link.presentation) : null;
}

export async function upsertPresentation(
  account: AuthenticatedAccount,
  body: UpsertShareLinkPresentationBody,
) {
  const prisma = getPrismaClient();
  const link = await prisma.privateShareLink.findFirst({
    where: { id: body.shareLinkId, accountId: account.id },
    include: { presentation: true },
  });
  if (!link) throw createNotFoundError('share link not found');

  const existing = link.presentation;
  const finalSlug = await ensureUniqueSlug(body.slug, existing?.id);
  const now = new Date();

  if (existing) {
    const updated = await prisma.shareLinkPresentation.update({
      where: { id: existing.id },
      data: {
        template: body.template,
        slug: finalSlug,
        ogTitle: body.ogTitle ?? null,
        ogSubtitle: body.ogSubtitle ?? null,
        ogCoverUrl: body.ogCoverUrl ?? null,
        themeColor: body.themeColor ?? null,
      },
    });
    return serialize(updated);
  }

  const created = await prisma.shareLinkPresentation.create({
    data: {
      id: randomUUID(),
      accountId: account.id,
      shareLinkId: link.id,
      template: body.template,
      slug: finalSlug,
      ogTitle: body.ogTitle ?? null,
      ogSubtitle: body.ogSubtitle ?? null,
      ogCoverUrl: body.ogCoverUrl ?? null,
      themeColor: body.themeColor ?? null,
      createdAt: now,
      updatedAt: now,
    },
  });
  return serialize(created);
}

export async function findPublicPresentationBySlug(slug: string) {
  const prisma = getPrismaClient();
  const presentation = await prisma.shareLinkPresentation.findUnique({
    where: { slug },
    include: { shareLink: true },
  });
  if (!presentation) return null;
  if (presentation.shareLink.revokedAt) return null;
  if (presentation.shareLink.expiresAt && presentation.shareLink.expiresAt < new Date()) {
    return null;
  }
  return {
    presentation: serialize(presentation),
    resourceType: presentation.shareLink.resourceType,
    resourceId: presentation.shareLink.resourceId,
    title: presentation.shareLink.title,
  };
}

/**
 * Build a 1200x630 OG SVG string for a slug. Front-end can adopt this directly,
 * or pass to @resvg/resvg-js for PNG output (loaded lazily to avoid hard dep).
 * 生成 1200x630 的 OG SVG，可由前端直接消费或交由 @resvg/resvg-js 转 PNG。
 */
export function buildOgSvg(input: {
  template: ShareTemplateDto;
  title: string;
  subtitle?: string | null;
  themeColor?: string | null;
}) {
  const palette =
    TEMPLATE_LIBRARY.find((t) => t.template === input.template)?.themeColor ?? '#1f2937';
  const bg = input.themeColor ?? palette;
  const safeTitle = (input.title ?? '').slice(0, 80).replace(/[<>&]/g, '');
  const safeSubtitle = (input.subtitle ?? '').slice(0, 160).replace(/[<>&]/g, '');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}" />
      <stop offset="100%" stop-color="#0b1220" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)" />
  <g fill="#f8fafc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB', sans-serif">
    <text x="80" y="220" font-size="64" font-weight="700">${safeTitle}</text>
    <text x="80" y="300" font-size="28" opacity="0.85">${safeSubtitle}</text>
    <text x="80" y="560" font-size="20" opacity="0.6">Personal Travel Daily · ${input.template}</text>
  </g>
</svg>`;
}
