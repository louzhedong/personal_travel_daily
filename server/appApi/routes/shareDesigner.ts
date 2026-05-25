import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  shareDesignerParamsSchema,
  sharePublicSlugParamsSchema,
  upsertShareLinkPresentationBodySchema,
} from '../schemas/shareLinkPresentation.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  buildOgSvg,
  findPublicPresentationBySlug,
  getPresentationByShareLink,
  listShareTemplates,
  upsertPresentation,
} from '../services/shareLinkPresentationService.js';

/**
 * F4 · Share Designer routes / 公开分享 v3 路由
 * Authenticated CRUD for presentation + public OG endpoint.
 * 已登录端：模板/封面 CRUD；公开端：OG 卡 SSR。
 */
export async function registerShareDesignerRoutes(app: FastifyInstance) {
  app.get('/api/share-designer/templates', async (request) => {
    await requireAuthenticatedAccount(request);
    return listShareTemplates();
  });

  app.get('/api/share-designer/:shareLinkId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(shareDesignerParamsSchema, request.params);
    const presentation = await getPresentationByShareLink(account, params.shareLinkId);
    return { presentation };
  });

  app.put('/api/share-designer', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(upsertShareLinkPresentationBodySchema, request.body ?? {});
    const presentation = await upsertPresentation(account, body);
    return { presentation };
  });

  // Public endpoints (no auth) — only expose the visual layer; token-hash chain unchanged.
  app.get('/p/:slug/og.svg', async (request, reply) => {
    const params = parseWithSchema(sharePublicSlugParamsSchema, request.params);
    const found = await findPublicPresentationBySlug(params.slug);
    if (!found) {
      reply.status(404);
      return { error: 'not found' };
    }
    const svg = buildOgSvg({
      template: found.presentation.template,
      title: found.presentation.ogTitle ?? found.title,
      subtitle: found.presentation.ogSubtitle,
      themeColor: found.presentation.themeColor,
    });
    reply.header('content-type', 'image/svg+xml; charset=utf-8');
    reply.header('cache-control', 'public, max-age=300');
    return reply.send(svg);
  });

  app.get('/p/:slug/og.png', async (request, reply) => {
    const params = parseWithSchema(sharePublicSlugParamsSchema, request.params);
    const found = await findPublicPresentationBySlug(params.slug);
    if (!found) {
      reply.status(404);
      return { error: 'not found' };
    }
    const svg = buildOgSvg({
      template: found.presentation.template,
      title: found.presentation.ogTitle ?? found.title,
      subtitle: found.presentation.ogSubtitle,
      themeColor: found.presentation.themeColor,
    });
    try {
      // Lazy import to avoid hard dependency when @resvg/resvg-js is unavailable.
      const mod = await import('@resvg/resvg-js').catch(() => null);
      if (!mod) {
        reply.header('content-type', 'image/svg+xml; charset=utf-8');
        return reply.send(svg);
      }
      const Resvg = (mod as { Resvg: new (svg: string) => { render: () => { asPng: () => Buffer } } })
        .Resvg;
      const renderer = new Resvg(svg);
      const png = renderer.render().asPng();
      reply.header('content-type', 'image/png');
      reply.header('cache-control', 'public, max-age=300');
      return reply.send(png);
    } catch {
      reply.header('content-type', 'image/svg+xml; charset=utf-8');
      return reply.send(svg);
    }
  });

  app.get('/p/:slug/meta', async (request, reply) => {
    const params = parseWithSchema(sharePublicSlugParamsSchema, request.params);
    const found = await findPublicPresentationBySlug(params.slug);
    if (!found) {
      reply.status(404);
      return { error: 'not found' };
    }
    return {
      slug: found.presentation.slug,
      template: found.presentation.template,
      ogTitle: found.presentation.ogTitle ?? found.title,
      ogSubtitle: found.presentation.ogSubtitle,
      ogCoverUrl: found.presentation.ogCoverUrl,
      themeColor: found.presentation.themeColor,
      resourceType: found.resourceType,
    };
  });
}
