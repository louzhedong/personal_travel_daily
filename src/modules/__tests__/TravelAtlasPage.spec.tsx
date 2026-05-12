import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fetchAtlasTimeline } from '../../lib/api/atlasApi';
import TravelAtlasPage from '../atlas/TravelAtlasPage';

vi.mock('../../lib/api/atlasApi', () => ({
  fetchAtlasTimeline: vi.fn(),
}));

const response = {
  filters: { year: 'all', month: 'all', scope: 'all' },
  availableYears: ['2026'],
  companions: [{ id: 'c1', name: 'Alice', color: '#000' }],
  trips: [{ id: 'trip-1', name: '江南春游', startsAt: '2026-03-01', endsAt: '2026-03-03' }],
  summary: { markerCount: 1, travelDays: 1, cityCount: 1, regionCount: 1, countryCount: 0, photoCount: 1, companionCount: 1, tripCount: 1 },
  replay: [{ id: 'r1', order: 1, markerId: 'm1', title: '浙江 · 杭州', description: '西湖晚风', visitedStartAt: '2026-03-02', visitedEndAt: '2026-03-02', scope: 'domestic', scopeId: 'cn-zhejiang', scopeName: '浙江', city: '杭州', companion: { id: 'c1', name: 'Alice', color: '#000' }, metadata: { tags: [] } }],
  placeIndex: { regions: [{ scope: 'domestic', scopeId: 'cn-zhejiang', scopeName: '浙江', markerCount: 1, photoCount: 1, cities: [{ city: '杭州', markerCount: 1, photoCount: 1 }] }] },
  compare: { years: [{ year: '2026', markerCount: 1, travelDays: 1, cityCount: 1, photoCount: 1 }], companions: [], scopes: [] },
  exportModel: { posterTitle: '旅行地图时间机器', posterSubtitle: '2026 · 1 段旅行记录 · 1 座城市', routeTitle: '浙江 · 杭州', indexTitle: '1 座城市索引' },
  generatedAt: '2026-05-12T00:00:00.000Z',
};

describe('TravelAtlasPage', () => {
  it('renders atlas data and replay controls', async () => {
    vi.mocked(fetchAtlasTimeline).mockResolvedValue(response as never);

    render(
      <TravelAtlasPage
        account={{ id: 'acct-1', name: 'Voyage Atlas', username: 'demo', role: 'member' }}
        onLogout={vi.fn()}
        onNavigateBack={vi.fn()}
      />,
    );

    expect(await screen.findByRole('heading', { name: '地图时间机器' })).toBeInTheDocument();
    expect(screen.getByText('浙江 · 杭州')).toBeInTheDocument();
    expect(screen.getByText('地名索引')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '播放' }));
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();
    await waitFor(() => expect(fetchAtlasTimeline).toHaveBeenCalledWith({ year: 'all', month: 'all', scope: 'all' }));
  });
});
