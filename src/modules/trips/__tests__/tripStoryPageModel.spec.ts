import { describe, expect, it } from 'vitest';
import type { TripDetailResponseDto } from '../../../lib/api/types';
import {
  buildTripStoryBadges,
  buildTripStoryChecklistReview,
  buildTripStoryFeaturedPhotos,
  buildTripStoryPhotoSections,
  buildTripStoryRoutePoster,
  buildTripStoryRouteStops,
  buildTripStoryShareCard,
  buildTripStoryTimelineDays,
  buildTripStoryViewModel,
} from '../tripStoryPageModel';

const baseTripDetail: TripDetailResponseDto = {
  trip: {
    id: 'trip-1',
    name: '江南春游',
    note: '一次慢下来看的江南周末。',
    startsAt: '2026-05-01',
    endsAt: '2026-05-03',
    createdAt: '2026-04-20T00:00:00.000Z',
    coverImageUrl: undefined,
  },
  summary: {
    markerCount: 3,
    travelDays: 3,
    cityCount: 2,
    regionCount: 2,
    companionCount: 2,
    guideCount: 1,
    photoCount: 2,
  },
  companions: [
    { id: 'user-alice', name: '小悠', color: '#2563eb', markerCount: 2 },
    { id: 'user-bob', name: '阿川', color: '#16a34a', markerCount: 1 },
  ],
  markers: [
    {
      id: 'marker-2',
      companionId: 'user-bob',
      companionName: '阿川',
      companionColor: '#16a34a',
      scope: 'domestic',
      scopeId: 'js',
      scopeName: '江苏',
      city: '苏州',
      note: '园林里走了很久。',
      tags: ['museum'],
      mood: 'peaceful',
      weather: 'cloudy',
      transport: 'train',
      budgetLevel: 'medium',
      imageUrls: [],
      visitedStartAt: '2026-05-02',
      visitedEndAt: '2026-05-02',
    },
    {
      id: 'marker-1',
      companionId: 'user-alice',
      companionName: '小悠',
      companionColor: '#2563eb',
      scope: 'domestic',
      scopeId: 'zj',
      scopeName: '浙江',
      city: '杭州',
      note: '西湖晚风很好。',
      tags: ['food', 'citywalk'],
      weather: 'sunny',
      transport: 'walk',
      budgetLevel: 'low',
      imageUrls: ['https://example.com/hangzhou.jpg'],
      visitedStartAt: '2026-05-01',
      visitedEndAt: '2026-05-01',
    },
    {
      id: 'marker-3',
      companionId: 'user-alice',
      companionName: '小悠',
      companionColor: '#2563eb',
      scope: 'domestic',
      scopeId: 'zj',
      scopeName: '浙江',
      city: '杭州',
      note: '返程前又去了湖边。',
      imageUrls: ['https://example.com/hangzhou-2.jpg'],
      visitedStartAt: '2026-05-03',
      visitedEndAt: '2026-05-03',
    },
  ],
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
    {
      imageId: 'image-2',
      markerId: 'marker-3',
      markerTitle: '浙江 · 杭州',
      imageUrl: 'https://example.com/hangzhou-2.jpg',
      visitedStartAt: '2026-05-03',
      scopeName: '浙江',
      city: '杭州',
      isFeatured: false,
    },
  ],
  guides: [
    {
      id: 'guide-1',
      markerId: 'marker-1',
      keyword: '杭州周末',
      savedAt: '2026-05-05T00:00:00.000Z',
      result: {
        id: 'guide-doc-1',
        title: '杭州周末攻略',
        summary: '西湖和灵隐寺路线建议。',
        sourceName: 'Qyer',
        sourceUrl: 'https://example.com/guide',
      },
    },
  ],
  checklistSummary: {
    total: 4,
    preDepartureCount: 1,
    inTransitCount: 1,
    doneCount: 2,
  },
  checklistGroups: [
    {
      stage: 'pre_departure',
      title: '出发前准备',
      description: '出发前确认。',
      itemCount: 1,
      items: [
        {
          id: 'item-1',
          companionId: 'user-alice',
          companionName: '小悠',
          companionColor: '#2563eb',
          title: '确认酒店',
          stage: 'pre_departure',
          sortOrder: 0,
          origin: 'manual',
          createdAt: '2026-04-20T00:00:00.000Z',
          updatedAt: '2026-04-20T00:00:00.000Z',
        },
      ],
    },
    {
      stage: 'in_transit',
      title: '旅途中留意',
      description: '途中提醒。',
      itemCount: 1,
      items: [],
    },
    {
      stage: 'done',
      title: '已经完成',
      description: '完成事项。',
      itemCount: 2,
      items: [],
    },
  ],
  meta: {
    generatedAt: '2026-05-06T12:30:00.000Z',
  },
};

describe('tripStoryPageModel', () => {
  it('builds a complete story model from trip detail data', () => {
    const model = buildTripStoryViewModel(baseTripDetail);

    expect(model.title).toBe('江南春游');
    expect(model.coverImageUrl).toBe('https://example.com/hangzhou.jpg');
    expect(model.featuredPhotos.map((photo) => photo.imageId)).toEqual(['image-1']);
    expect(model.photoSections[0]).toMatchObject({ key: 'featured', title: '精选瞬间' });
    expect(model.lead).toBe('一次慢下来看的江南周末。');
    expect(model.highlights).toHaveLength(6);
    expect(model.badges.map((badge) => badge.id)).toEqual([
      'route-span',
      'photo-curation',
      'checklist-memory',
      'guide-context',
      'detail-density',
      'shared-memory',
    ]);
    expect(model.routePoster.title).toBe('浙江 · 杭州 到 浙江 · 杭州');
    expect(model.shareCard.coverImageUrl).toBe('https://example.com/hangzhou.jpg');
    expect(model.shareCard.metrics.map((metric) => metric.label)).toEqual(['旅行天数', '覆盖城市', '同行旅伴']);
    expect(model.timelineDays.map((day) => day.date)).toEqual(['2026-05-01', '2026-05-02', '2026-05-03']);
    expect(model.photoGroups).toHaveLength(2);
    expect(model.guides[0].result.title).toBe('杭州周末攻略');
    expect(model.checklistReview.completionText).toBe('2 / 4 项已完成，完成度 50%');
  });

  it('builds featured photo sections with caption-first story copy', () => {
    const featured = buildTripStoryFeaturedPhotos(baseTripDetail.photos);
    const sections = buildTripStoryPhotoSections(baseTripDetail.photos);

    expect(featured).toHaveLength(1);
    expect(featured[0]).toMatchObject({ imageId: 'image-1', caption: '西湖晚风' });
    expect(sections.map((section) => section.key)).toEqual(['featured', '2026-05-03']);
    expect(sections[0].photos[0].caption).toBe('西湖晚风');
  });

  it('sorts timeline days and route stops by visited date', () => {
    const days = buildTripStoryTimelineDays(baseTripDetail.markers);
    const stops = buildTripStoryRouteStops(baseTripDetail.markers);
    const poster = buildTripStoryRoutePoster(stops);

    expect(days[0].markers[0].city).toBe('杭州');
    expect(days[1].markers[0].city).toBe('苏州');
    expect(stops.map((stop) => stop.label)).toEqual(['浙江 · 杭州', '江苏 · 苏州', '浙江 · 杭州']);
    expect(poster.stops.map((stop) => stop.shortLabel)).toEqual(['杭州', '苏州', '杭州']);
    expect(poster.subtitle).toContain('3 站路线回放');
  });

  it('handles empty photos, guides, markers, and checklist gracefully', () => {
    const emptyModel = buildTripStoryViewModel({
      ...baseTripDetail,
      trip: { ...baseTripDetail.trip, note: '' },
      summary: {
        ...baseTripDetail.summary,
        markerCount: 0,
        cityCount: 0,
        guideCount: 0,
        photoCount: 0,
      },
      markers: [],
      photos: [],
      guides: [],
      checklistSummary: {
        total: 0,
        preDepartureCount: 0,
        inTransitCount: 0,
        doneCount: 0,
      },
      checklistGroups: [],
    });

    expect(emptyModel.lead).toBe('这次行程还没有旅行记录，故事页会在补充记录后自动丰满起来。');
    expect(emptyModel.badges.map((badge) => badge.id)).toEqual(['waiting-for-records', 'trip-dates-ready']);
    expect(emptyModel.routePoster.emptyText).toBe('还没有可展示的路线停靠点。');
    expect(emptyModel.photoGroups).toEqual([]);
    expect(emptyModel.guides).toEqual([]);
    expect(emptyModel.checklistReview.completionText).toBe('这次行程还没有沉淀行前清单。');
  });

  it('builds checklist completion text', () => {
    expect(buildTripStoryChecklistReview(baseTripDetail)).toMatchObject({
      total: 4,
      doneCount: 2,
      completionPercent: 50,
      completionText: '2 / 4 项已完成，完成度 50%',
    });
  });

  it('builds story badges from route, photo, checklist, guide and metadata signals', () => {
    const badges = buildTripStoryBadges(baseTripDetail);

    expect(badges).toHaveLength(6);
    expect(badges.find((badge) => badge.id === 'route-span')).toMatchObject({
      label: '多城串联',
      value: '2',
      tone: 'route',
    });
    expect(badges.find((badge) => badge.id === 'photo-curation')).toMatchObject({
      label: '精选照片',
      value: '1',
      tone: 'photo',
    });
    expect(badges.find((badge) => badge.id === 'checklist-memory')).toMatchObject({
      value: '50%',
      tone: 'checklist',
    });
  });

  it('uses explicit cover, then featured photo, then regular photo for share cards', () => {
    expect(buildTripStoryShareCard(baseTripDetail, 'https://example.com/cover.jpg').coverImageUrl).toBe(
      'https://example.com/cover.jpg',
    );

    const modelWithFeaturedFallback = buildTripStoryViewModel(baseTripDetail);
    expect(modelWithFeaturedFallback.shareCard.coverImageUrl).toBe('https://example.com/hangzhou.jpg');

    const modelWithRegularFallback = buildTripStoryViewModel({
      ...baseTripDetail,
      photos: [
        {
          ...baseTripDetail.photos[1],
          isFeatured: false,
        },
      ],
    });
    expect(modelWithRegularFallback.shareCard.coverImageUrl).toBe('https://example.com/hangzhou-2.jpg');
  });
});
