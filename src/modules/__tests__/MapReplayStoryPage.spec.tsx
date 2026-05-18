import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fetchTripMapReplayStory } from '../../lib/api/mapReplayStoriesApi';
import MapReplayStoryPage from '../replay/MapReplayStoryPage';

vi.mock('../../lib/api/mapReplayStoriesApi', () => ({
  fetchTripMapReplayStory: vi.fn(),
  fetchYearMapReplayStory: vi.fn(),
  fetchCompanionMapReplayStory: vi.fn(),
}));

const story = {
  target: { type: 'trip' as const, id: 'trip-1', label: '江南春游', subtitle: '2026-05-01 - 2026-05-03' },
  summary: {
    markerCount: 1,
    travelDays: 1,
    cityCount: 1,
    regionCount: 1,
    countryCount: 0,
    photoCount: 0,
    companionCount: 1,
    tripCount: 1,
  },
  replay: [
    {
      id: 'replay-1',
      order: 1,
      markerId: 'marker-1',
      title: '浙江 · 杭州',
      description: '西湖晚风',
      visitedStartAt: '2026-05-01',
      visitedEndAt: '2026-05-01',
      scope: 'domestic' as const,
      scopeId: 'zj',
      scopeName: '浙江',
      city: '杭州',
      companion: { id: 'user-alice', name: 'Alice', color: '#0f172a' },
      metadata: { tags: [] },
    },
  ],
  placeIndex: { regions: [{ scope: 'domestic' as const, scopeId: 'zj', scopeName: '浙江', markerCount: 1, photoCount: 0, cities: [] }] },
  photos: [],
  guides: [],
  chapters: [{ id: 'opening', eyebrow: 'Opening', title: '开场', body: '西湖晚风很好。' }],
  exportModel: { filenameSlug: 'trip-trip-1', posterTitle: '江南春游 地图回放故事', posterSubtitle: '1 段记录', routeTitle: '浙江 · 杭州' },
  sourceLinks: [],
  emptyStates: [],
  generatedAt: '2026-05-12T00:00:00.000Z',
};

describe('MapReplayStoryPage', () => {
  it('renders replay story and export action', async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const originalClick = HTMLAnchorElement.prototype.click;
    URL.createObjectURL = vi.fn(() => 'blob:replay-story');
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
    vi.mocked(fetchTripMapReplayStory).mockResolvedValue(story);

    render(
      <MapReplayStoryPage
        account={{ id: 'acct-1', name: 'Voyage Atlas', username: 'demo', role: 'member' }}
        targetType="trip"
        targetId="trip-1"
        onLogout={vi.fn()}
        onNavigateBack={vi.fn()}
      />,
    );

    expect(await screen.findByText('江南春游 地图回放故事')).toBeInTheDocument();
    expect(screen.getByText('浙江 · 杭州')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '导出回放长图' }));
    await waitFor(() => expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce());

    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    HTMLAnchorElement.prototype.click = originalClick;
  });
});
