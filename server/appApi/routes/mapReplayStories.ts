import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  getCompanionMapReplayStory,
  getTripMapReplayStory,
  getYearMapReplayStory,
} from '../services/mapReplayStoryService.js';

export async function registerMapReplayStoryRoutes(app: FastifyInstance) {
  app.get('/api/map-replay-stories/trip/:tripId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const { tripId } = request.params as { tripId: string };
    return getTripMapReplayStory(account, tripId);
  });

  app.get('/api/map-replay-stories/year/:year', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const { year } = request.params as { year: string };
    return getYearMapReplayStory(account, year);
  });

  app.get('/api/map-replay-stories/companion/:companionId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const { companionId } = request.params as { companionId: string };
    return getCompanionMapReplayStory(account, companionId);
  });
}
