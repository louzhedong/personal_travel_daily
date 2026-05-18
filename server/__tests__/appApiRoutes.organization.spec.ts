// @vitest-environment node

import { expect, it } from 'vitest';
import { currentAccount, describeAppApiRoutesDomain, mocks } from './appApiRoutes.setup.js';
import { buildApp } from '../appApi/buildApp.js';

const workbench = {
  summary: { totalIssues: 1, unassignedMarkers: 1, missingPhotoCaptions: 0, unlinkedGuides: 0, unfeaturedPhotos: 0, weakMarkerTags: 0, readyTrips: 1 },
  tripOptions: [{ id: 'trip-1', name: '杭州周末', startsAt: '2026-05-01T00:00:00.000Z', endsAt: '2026-05-03T00:00:00.000Z' }],
  sections: { unassignedMarkers: [], missingPhotoCaptions: [], unlinkedGuides: [], unfeaturedPhotos: [], weakMarkerTags: [] },
  generatedAt: '2026-05-12T00:00:00.000Z',
};

describeAppApiRoutesDomain('organization', () => {
  it('returns organization workbench', async () => {
    mocks.getOrganizationWorkbenchMock.mockResolvedValue(workbench);
    const app = await buildApp();
    try {
      const response = await app.inject({ method: 'GET', url: '/api/organization/workbench' });
      expect(response.statusCode).toBe(200);
      expect(mocks.getOrganizationWorkbenchMock).toHaveBeenCalledWith(currentAccount.id);
      expect(response.json().summary.totalIssues).toBe(1);
    } finally {
      await app.close();
    }
  });

  it('previews organization action', async () => {
    mocks.previewOrganizationActionMock.mockResolvedValue({
      actionType: 'assignMarkersToTrip',
      dryRun: true,
      changeCount: 1,
      changes: [{ targetId: 'marker-1', targetTitle: '浙江 · 杭州', before: '未归入行程', after: '杭州周末' }],
    });
    const app = await buildApp();
    try {
      const payload = { type: 'assignMarkersToTrip', markerIds: ['marker-1'], tripId: 'trip-1' };
      const response = await app.inject({ method: 'POST', url: '/api/organization/actions/preview', payload });
      expect(response.statusCode).toBe(200);
      expect(mocks.previewOrganizationActionMock).toHaveBeenCalledWith(currentAccount.id, payload);
      expect(response.json().dryRun).toBe(true);
    } finally {
      await app.close();
    }
  });

  it('applies organization action', async () => {
    mocks.applyOrganizationActionMock.mockResolvedValue({
      actionType: 'featurePhotos',
      dryRun: false,
      applied: true,
      changeCount: 1,
      changes: [],
      workbench,
    });
    const app = await buildApp();
    try {
      const payload = { type: 'featurePhotos', imageIds: ['image-1'] };
      const response = await app.inject({ method: 'POST', url: '/api/organization/actions/apply', payload });
      expect(response.statusCode).toBe(200);
      expect(mocks.applyOrganizationActionMock).toHaveBeenCalledWith(currentAccount.id, payload);
      expect(response.json().applied).toBe(true);
    } finally {
      await app.close();
    }
  });
});

