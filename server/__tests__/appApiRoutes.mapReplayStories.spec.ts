// @vitest-environment node

import { expect, it } from 'vitest';
import { currentAccount, describeAppApiRoutesDomain, mocks } from './appApiRoutes.setup.js';
import { buildApp } from '../appApi/buildApp.js';

const replayStoryResponse = {
  target: { type: 'trip' as const, id: 'trip-1', label: '江南春游' },
  summary: {
    markerCount: 1,
    travelDays: 1,
    cityCount: 1,
    regionCount: 1,
    countryCount: 0,
    photoCount: 1,
    companionCount: 1,
    tripCount: 1,
  },
  replay: [],
  placeIndex: { regions: [] },
  photos: [],
  guides: [],
  chapters: [],
  exportModel: {
    filenameSlug: 'trip-trip-1',
    posterTitle: '江南春游 地图回放故事',
    posterSubtitle: '1 段记录',
    routeTitle: '等待第一段旅行轨迹',
  },
  sourceLinks: [],
  emptyStates: [],
  generatedAt: '2026-05-12T00:00:00.000Z',
};

describeAppApiRoutesDomain('map replay stories', () => {
  it('serves trip, year and companion replay story routes', async () => {
    mocks.getTripMapReplayStoryMock.mockResolvedValue(replayStoryResponse);
    mocks.getYearMapReplayStoryMock.mockResolvedValue({ ...replayStoryResponse, target: { type: 'year', id: '2026', label: '2026 年度回放' } });
    mocks.getCompanionMapReplayStoryMock.mockResolvedValue({ ...replayStoryResponse, target: { type: 'companion', id: 'user-alice', label: '和 Alice 的地图回放' } });

    const app = await buildApp();
    try {
      const tripResponse = await app.inject({ method: 'GET', url: '/api/map-replay-stories/trip/trip-1' });
      expect(tripResponse.statusCode).toBe(200);
      expect(mocks.getTripMapReplayStoryMock).toHaveBeenCalledWith(currentAccount, 'trip-1');

      const yearResponse = await app.inject({ method: 'GET', url: '/api/map-replay-stories/year/2026' });
      expect(yearResponse.statusCode).toBe(200);
      expect(mocks.getYearMapReplayStoryMock).toHaveBeenCalledWith(currentAccount, '2026');

      const companionResponse = await app.inject({ method: 'GET', url: '/api/map-replay-stories/companion/user-alice' });
      expect(companionResponse.statusCode).toBe(200);
      expect(mocks.getCompanionMapReplayStoryMock).toHaveBeenCalledWith(currentAccount, 'user-alice');
    } finally {
      await app.close();
    }
  });
});
