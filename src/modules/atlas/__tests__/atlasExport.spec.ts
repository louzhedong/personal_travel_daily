import { describe, expect, it } from 'vitest';
import { buildAtlasIndexSvg, buildAtlasPosterSvg, buildAtlasReplaySvg } from '../atlasExport';
import type { AtlasTimelineResponseDto } from '../../../lib/api/types';

const data: AtlasTimelineResponseDto = {
  filters: { year: '2026', month: 'all', scope: 'all' },
  availableYears: ['2026'],
  companions: [],
  trips: [],
  summary: { markerCount: 1, travelDays: 1, cityCount: 1, regionCount: 1, countryCount: 0, photoCount: 1, companionCount: 1, tripCount: 1 },
  replay: [{ id: 'r1', order: 1, markerId: 'm1', title: '浙江 · 杭州', description: '西湖', visitedStartAt: '2026-03-02', visitedEndAt: '2026-03-02', scope: 'domestic', scopeId: 'cn-zhejiang', scopeName: '浙江', city: '杭州', companion: { id: 'c1', name: 'Alice', color: '#000' }, metadata: { tags: [] } }],
  placeIndex: { regions: [{ scope: 'domestic', scopeId: 'cn-zhejiang', scopeName: '浙江', markerCount: 1, photoCount: 1, cities: [{ city: '杭州', markerCount: 1, photoCount: 1 }] }] },
  compare: { years: [], companions: [], scopes: [] },
  exportModel: { posterTitle: '旅行地图时间机器', posterSubtitle: '2026 · 1 段旅行记录 · 1 座城市', routeTitle: '浙江 · 杭州', indexTitle: '1 座城市索引' },
  generatedAt: '2026-05-12T00:00:00.000Z',
};

describe('atlasExport', () => {
  it('builds poster, index and replay svg documents', () => {
    expect(buildAtlasPosterSvg(data)).toContain('TRAVEL ATLAS');
    expect(buildAtlasIndexSvg(data)).toContain('PLACE INDEX');
    expect(buildAtlasReplaySvg(data)).toContain('ROUTE REPLAY');
  });
});
