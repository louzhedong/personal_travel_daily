// @vitest-environment node

import { expect, it } from 'vitest';
import { currentAccount, describeAppApiRoutesDomain, mocks } from './appApiRoutes.setup.js';
import { buildApp } from '../appApi/buildApp.js';

describeAppApiRoutesDomain('trips', () => {
  it('returns trip detail payload for authenticated accounts', async () => {
    mocks.getTripDetailMock.mockResolvedValue({
      trip: {
        id: 'trip-1',
        name: '江南春游',
        note: '杭州与苏州周末行',
        startsAt: '2026-05-01',
        endsAt: '2026-05-03',
        createdAt: '2026-04-22T00:00:00.000Z',
      },
      summary: {
        markerCount: 2,
        travelDays: 3,
        cityCount: 2,
        regionCount: 2,
        companionCount: 1,
        guideCount: 1,
        photoCount: 2,
      },
      companions: [{ id: 'user-alice', name: '小悠', color: '#2563eb', markerCount: 2 }],
      markers: [],
      photos: [],
      guides: [],
      checklistSummary: {
        total: 2,
        preDepartureCount: 1,
        inTransitCount: 1,
        doneCount: 0,
      },
      checklistGroups: [
        {
          stage: 'pre_departure',
          title: '出发前准备',
          description: '把预约、路线、装备和行前确认放在这里。',
          itemCount: 1,
          items: [],
        },
        {
          stage: 'in_transit',
          title: '旅途中留意',
          description: '把路上节奏、交通衔接和现场提醒收在这里。',
          itemCount: 1,
          items: [],
        },
        {
          stage: 'done',
          title: '已经完成',
          description: '完成的事项会沉淀到这一组，方便回看。',
          itemCount: 0,
          items: [],
        },
      ],
      meta: {
        generatedAt: '2026-04-22T00:00:00.000Z',
      },
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/trips/trip-1/detail',
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.getTripDetailMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1');
      expect(response.json().trip.name).toBe('江南春游');
      expect(response.json().checklistSummary.total).toBe(2);
    } finally {
      await app.close();
    }
  });

  it('updates trip photo curation for authenticated accounts', async () => {
    mocks.updateTripPhotoCurationMock.mockResolvedValue({
      trip: {
        id: 'trip-1',
        name: '江南春游',
        note: '',
        startsAt: '2026-05-01',
        endsAt: '2026-05-03',
        createdAt: '2026-04-22T00:00:00.000Z',
      },
      summary: {
        markerCount: 1,
        travelDays: 1,
        cityCount: 1,
        regionCount: 1,
        companionCount: 1,
        guideCount: 0,
        photoCount: 1,
      },
      companions: [],
      markers: [],
      photos: [
        {
          imageId: 'image-1',
          markerId: 'marker-1',
          markerTitle: '浙江 · 杭州',
          imageUrl: 'https://example.com/hangzhou.jpg',
          visitedStartAt: '2026-05-01',
          scopeName: '浙江',
          city: '杭州',
          isFeatured: true,
          caption: '西湖晚风',
          curatedSortOrder: 0,
        },
      ],
      guides: [],
      planningSummary: { total: 0, plannedCount: 0, convertedCount: 0, highPriorityCount: 0 },
      checklistSummary: { total: 0, preDepartureCount: 0, inTransitCount: 0, doneCount: 0 },
      checklistGroups: [],
      meta: {
        generatedAt: '2026-04-22T00:00:00.000Z',
      },
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/trips/trip-1/photos/curation',
        payload: {
          items: [
            {
              imageId: 'image-1',
              isFeatured: true,
              caption: '西湖晚风',
              curatedSortOrder: 0,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.updateTripPhotoCurationMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', {
        items: [
          {
            imageId: 'image-1',
            isFeatured: true,
            caption: '西湖晚风',
            curatedSortOrder: 0,
          },
        ],
      });
      expect(response.json().photos[0].isFeatured).toBe(true);
    } finally {
      await app.close();
    }
  });

  it('supports trip checklist routes for authenticated accounts', async () => {
    mocks.listTripChecklistMock.mockResolvedValue({
      summary: { total: 1, preDepartureCount: 1, inTransitCount: 0, doneCount: 0 },
      groups: [],
    });
    mocks.generateTripChecklistMock.mockResolvedValue({
      createdCount: 3,
      deduplicatedCount: 0,
      items: [],
    });
    mocks.createTripChecklistItemResourceMock.mockResolvedValue({
      id: 'item-1',
      companionId: 'user-alice',
      companionName: '小悠',
      companionColor: '#2563eb',
      title: '准备机场交通',
      stage: 'pre_departure',
      sortOrder: 0,
      origin: 'manual',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
    });
    mocks.updateTripChecklistItemResourceMock.mockResolvedValue({
      id: 'item-1',
      companionId: 'user-alice',
      companionName: '小悠',
      companionColor: '#2563eb',
      title: '准备机场交通',
      stage: 'done',
      sortOrder: 0,
      origin: 'manual',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-02T00:00:00.000Z',
    });
    mocks.deleteTripChecklistItemResourceMock.mockResolvedValue({
      deletedId: 'item-1',
    });

    const app = await buildApp();
    try {
      const listResponse = await app.inject({
        method: 'GET',
        url: '/api/trips/trip-1/checklist',
      });
      const generateResponse = await app.inject({
        method: 'POST',
        url: '/api/trips/trip-1/checklist/generate',
        payload: {
          companionId: 'user-alice',
          guide: {
            title: '京都春日路线',
            summary: '适合第一次去京都的三天行程。',
            sourceName: 'Mock Guide',
            sourceUrl: 'https://example.com/guides/kyoto',
          },
        },
      });
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/trips/trip-1/checklist/items',
        payload: {
          companionId: 'user-alice',
          title: '准备机场交通',
          note: '优先地铁',
          stage: 'pre_departure',
        },
      });
      const updateResponse = await app.inject({
        method: 'PATCH',
        url: '/api/trips/trip-1/checklist/items/item-1',
        payload: {
          stage: 'done',
        },
      });
      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: '/api/trips/trip-1/checklist/items/item-1',
      });

      expect(listResponse.statusCode).toBe(200);
      expect(generateResponse.statusCode).toBe(200);
      expect(createResponse.statusCode).toBe(200);
      expect(updateResponse.statusCode).toBe(200);
      expect(deleteResponse.statusCode).toBe(200);
      expect(mocks.listTripChecklistMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1');
      expect(mocks.generateTripChecklistMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', expect.any(Object));
      expect(mocks.createTripChecklistItemResourceMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', {
        companionId: 'user-alice',
        title: '准备机场交通',
        note: '优先地铁',
        stage: 'pre_departure',
      });
      expect(mocks.updateTripChecklistItemResourceMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', 'item-1', {
        stage: 'done',
      });
      expect(mocks.deleteTripChecklistItemResourceMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', 'item-1');
    } finally {
      await app.close();
    }
  });

  it('supports trip planning routes for authenticated accounts', async () => {
    const planningItem = {
      id: 'plan-1',
      tripId: 'trip-1',
      companionId: 'user-alice',
      companionName: '小悠',
      companionColor: '#2563eb',
      title: '岚山竹林',
      scope: 'international',
      scopeId: 'japan',
      scopeName: '日本',
      city: '京都',
      priority: 'high',
      status: 'planned',
      sortOrder: 0,
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
    };
    mocks.listTripPlanningMock.mockResolvedValue({
      summary: { total: 1, plannedCount: 1, convertedCount: 0, highPriorityCount: 1 },
      items: [planningItem],
    });
    mocks.createTripPlanningItemResourceMock.mockResolvedValue(planningItem);
    mocks.updateTripPlanningItemResourceMock.mockResolvedValue({ ...planningItem, priority: 'medium' });
    mocks.deleteTripPlanningItemResourceMock.mockResolvedValue({ deletedId: 'plan-1' });
    mocks.convertTripPlanningItemToMarkerMock.mockResolvedValue({ markers: [], users: [], trips: [], activeUserId: 'user-alice', savedGuides: [], guideSearchHistory: [] });

    const app = await buildApp();
    try {
      const listResponse = await app.inject({ method: 'GET', url: '/api/trips/trip-1/planning' });
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/trips/trip-1/planning/items',
        payload: {
          companionId: 'user-alice',
          title: '岚山竹林',
          scope: 'international',
          scopeId: 'japan',
          scopeName: '日本',
          city: '京都',
          priority: 'high',
        },
      });
      const updateResponse = await app.inject({
        method: 'PATCH',
        url: '/api/trips/trip-1/planning/items/plan-1',
        payload: { priority: 'medium' },
      });
      const convertResponse = await app.inject({
        method: 'POST',
        url: '/api/trips/trip-1/planning/items/plan-1/convert-to-marker',
        payload: {
          visitedStartAt: '2026-05-01',
          visitedEndAt: '2026-05-01',
        },
      });
      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: '/api/trips/trip-1/planning/items/plan-1',
      });

      expect(listResponse.statusCode).toBe(200);
      expect(createResponse.statusCode).toBe(200);
      expect(updateResponse.statusCode).toBe(200);
      expect(convertResponse.statusCode).toBe(200);
      expect(deleteResponse.statusCode).toBe(200);
      expect(mocks.listTripPlanningMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1');
      expect(mocks.createTripPlanningItemResourceMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', expect.objectContaining({ title: '岚山竹林' }));
      expect(mocks.updateTripPlanningItemResourceMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', 'plan-1', { priority: 'medium' });
      expect(mocks.convertTripPlanningItemToMarkerMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', 'plan-1', expect.objectContaining({ visitedStartAt: '2026-05-01' }));
      expect(mocks.deleteTripPlanningItemResourceMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', 'plan-1');
    } finally {
      await app.close();
    }
  });

  it('imports wishlist items into trip planning', async () => {
    const planningItem = {
      id: 'planning-from-wishlist',
      tripId: 'trip-1',
      companionId: 'user-alice',
      companionName: '小悠',
      companionColor: '#2563eb',
      title: '京都',
      scope: 'international',
      scopeId: 'japan',
      scopeName: '日本',
      city: '京都',
      priority: 'medium',
      sourceWishlistId: 'wishlist-1',
      status: 'planned',
      sortOrder: 1,
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
    };
    mocks.createTripPlanningItemFromWishlistMock.mockResolvedValue(planningItem);

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/trips/trip-1/planning/from-wishlist/wishlist-1',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().id).toBe('planning-from-wishlist');
      expect(mocks.createTripPlanningItemFromWishlistMock).toHaveBeenCalledWith(
        currentAccount.id,
        'trip-1',
        'wishlist-1',
      );
    } finally {
      await app.close();
    }
  });

  it('supports trip planning schedule routes', async () => {
    const schedulePayload = {
      summary: { total: 1, plannedCount: 1, convertedCount: 0, highPriorityCount: 1 },
      days: [
        {
          date: '2026-05-01',
          dayIndex: 1,
          title: 'Day 1',
          items: [],
          checklistGroups: [],
        },
      ],
      unscheduledItems: [],
      checklistGroups: [],
    };
    mocks.getTripPlanningScheduleMock.mockResolvedValue(schedulePayload);
    mocks.updateTripPlanningItemScheduleMock.mockResolvedValue(schedulePayload);
    mocks.importWishlistItemsToTripPlanningScheduleMock.mockResolvedValue(schedulePayload);

    const app = await buildApp();
    try {
      const scheduleResponse = await app.inject({
        method: 'GET',
        url: '/api/trips/trip-1/planning/schedule',
      });
      const updateResponse = await app.inject({
        method: 'PATCH',
        url: '/api/trips/trip-1/planning/items/plan-1/schedule',
        payload: { plannedDate: '2026-05-01' },
      });
      const importResponse = await app.inject({
        method: 'POST',
        url: '/api/trips/trip-1/planning/schedule/import-wishlist',
        payload: { wishlistIds: ['wishlist-1', 'wishlist-2'], plannedDate: '2026-05-01' },
      });

      expect(scheduleResponse.statusCode).toBe(200);
      expect(updateResponse.statusCode).toBe(200);
      expect(importResponse.statusCode).toBe(200);
      expect(mocks.getTripPlanningScheduleMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1');
      expect(mocks.updateTripPlanningItemScheduleMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', 'plan-1', {
        plannedDate: '2026-05-01',
      });
      expect(mocks.importWishlistItemsToTripPlanningScheduleMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', {
        wishlistIds: ['wishlist-1', 'wishlist-2'],
        plannedDate: '2026-05-01',
      });
    } finally {
      await app.close();
    }
  });
});
