import type { FastifyInstance, FastifyReply } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  buildRhythmPortraitForRender,
  getRhythmPortrait,
  refreshRhythmPortrait,
} from '../services/rhythmPortraitService.js';
import { renderRhythmPortraitSvg } from '../services/rhythmPortraitSvgRenderer.js';

/**
 * G5 · Travel Rhythm Portrait routes / 旅行节奏画像路由
 */
export async function registerRhythmPortraitRoutes(app: FastifyInstance) {
  app.get('/api/rhythm-portrait', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return getRhythmPortrait(account);
  });

  app.post('/api/rhythm-portrait/refresh', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return refreshRhythmPortrait(account);
  });

  app.get('/api/rhythm-portrait/share-card.svg', async (request, reply: FastifyReply) => {
    const account = await requireAuthenticatedAccount(request);
    const portrait = await buildRhythmPortraitForRender(account);
    const svg = renderRhythmPortraitSvg(portrait);
    reply.header('Content-Type', 'image/svg+xml; charset=utf-8');
    return reply.send(svg);
  });
}
