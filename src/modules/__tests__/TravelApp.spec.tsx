import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TravelApp from '../TravelApp';
import type { Scope, TravelStore } from '../../types';

const mocks = vi.hoisted(() => {
  const baseStore: TravelStore = {
    users: [
      { id: 'u1', name: '小悠', color: '#2563eb' },
      { id: 'u2', name: '阿泽', color: '#f97316' },
    ],
    activeUserId: 'u1',
    trips: [
      {
        id: 'trip-1',
        name: '京都春游',
        note: '',
        startsAt: '2026-04-01',
        endsAt: '2026-04-05',
        createdAt: '2026-03-01T00:00:00.000Z',
      },
    ],
    markers: [
      {
        id: 'marker-self',
        userId: 'u1',
        scope: 'domestic',
        scopeId: '浙江',
        scopeName: '浙江',
        city: '杭州',
        note: '西湖',
        visitedStartAt: '2026-04-01',
        visitedEndAt: '2026-04-01',
        createdAt: '2026-04-01T00:00:00.000Z',
      },
      {
        id: 'marker-other',
        userId: 'u2',
        scope: 'international',
        scopeId: 'japan',
        scopeName: '日本',
        city: '京都',
        note: '鸭川',
        visitedStartAt: '2026-04-02',
        visitedEndAt: '2026-04-02',
        createdAt: '2026-04-02T00:00:00.000Z',
      },
    ],
    savedGuides: [
      {
        id: 'saved-1',
        savedByUserId: 'u1',
        markerId: 'marker-self',
        keyword: '杭州',
        savedAt: '2026-04-03T00:00:00.000Z',
        result: {
          id: 'guide-1',
          title: '杭州周末',
          summary: '西湖路线',
          sourceName: 'Mock',
          sourceUrl: 'https://example.com/guide',
        },
      },
    ],
    guideSearchHistory: [],
  };

  return {
    baseStore,
    remoteTravelStoreRepositoryMock: {
      loadStore: vi.fn(),
    },
    createDefaultStoreMock: vi.fn(),
    focusMarkerByIdMock: vi.fn(),
    useLockedModalMock: vi.fn(),
    useMapContextMock: vi.fn(),
    useTravelStoreActionsMock: vi.fn(),
    searchMarkersMock: vi.fn(),
  };
});

vi.mock('../../lib/repositories/remoteTravelStoreRepository', () => ({
  remoteTravelStoreRepository: mocks.remoteTravelStoreRepositoryMock,
}));

vi.mock('../../lib/storage', () => ({
  createDefaultStore: mocks.createDefaultStoreMock,
}));

vi.mock('../app/markerNavigation', () => ({
  focusMarkerById: mocks.focusMarkerByIdMock,
}));

vi.mock('../app/useLockedModal', () => ({
  useLockedModal: mocks.useLockedModalMock,
}));

vi.mock('../app/useMapContext', () => ({
  useMapContext: mocks.useMapContextMock,
}));

vi.mock('../app/useTravelStoreActions', () => ({
  useTravelStoreActions: mocks.useTravelStoreActionsMock,
}));

vi.mock('../../lib/api/markersApi', () => ({
  searchMarkers: mocks.searchMarkersMock,
}));

vi.mock('../../components/ui/AppToast', () => ({
  default: ({ open, message }: { open: boolean; message: string }) => (open ? <div>{message}</div> : null),
}));

vi.mock('../../components/ui/ConfirmDialog', () => ({
  default: ({
    open,
    title,
    description,
    onCancel,
    onConfirm,
  }: {
    open: boolean;
    title: string;
    description: string;
    onCancel: () => void;
    onConfirm: () => void;
  }) =>
    open ? (
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
        <button type="button" onClick={onCancel}>
          取消删除
        </button>
        <button type="button" onClick={onConfirm}>
          确认删除
        </button>
      </div>
    ) : null,
}));

vi.mock('../../components/StatsPanel', () => ({
  default: ({ scope, markers }: { scope: Scope; markers: Array<{ id: string }> }) => (
    <div>{`stats-${scope}-${markers.length}`}</div>
  ),
}));

vi.mock('../app/AppHero', () => ({
  default: ({
    message,
    onOpenGuideSearch,
  }: {
    message: string;
    onOpenGuideSearch: () => void;
  }) => (
    <div>
      <div data-testid="hero-message">{message}</div>
      <button type="button" onClick={onOpenGuideSearch}>
        hero-open-guide
      </button>
    </div>
  ),
}));

vi.mock('../app/AppContent', () => ({
  default: ({
    onOpenDataSync,
    onViewMarkerDetail,
    onOpenMarkerFromGuide,
    onOpenMarkerFromTimeline,
    onFocusSearchResult,
    onRequestDeleteMarker,
    onOpenTripDetail,
    onSearchMarkers,
  }: {
    onOpenDataSync: () => void;
    onViewMarkerDetail: (markerId: string | null) => void;
    onOpenMarkerFromGuide: (markerId: string) => void;
    onOpenMarkerFromTimeline: (markerId: string) => void;
    onFocusSearchResult: (markerId: string) => void;
    onRequestDeleteMarker: (markerId: string) => void;
    onOpenTripDetail?: (tripId: string) => void;
    onSearchMarkers: unknown;
  }) => (
    <div>
      <button type="button" onClick={onOpenDataSync}>
        open-data-sync
      </button>
      <button type="button" onClick={() => onViewMarkerDetail('marker-self')}>
        view-detail
      </button>
      <button type="button" onClick={() => onOpenMarkerFromGuide('marker-self')}>
        focus-from-guide
      </button>
      <button type="button" onClick={() => onOpenMarkerFromTimeline('marker-other')}>
        focus-from-timeline
      </button>
      <button type="button" onClick={() => onFocusSearchResult('missing-marker')}>
        focus-from-search
      </button>
      <button type="button" onClick={() => onRequestDeleteMarker('marker-self')}>
        request-delete
      </button>
      <button type="button" onClick={() => onOpenTripDetail?.('trip-1')}>
        open-trip-detail
      </button>
      <div>{String(onSearchMarkers === mocks.searchMarkersMock)}</div>
    </div>
  ),
}));

vi.mock('../app/AppOverlays', () => ({
  default: ({
    detailMarker,
    dataSyncOpen,
    guideSearchOpen,
    guideSearchMarkerId,
    onOpenGuideSearchFromDetail,
    closeGuideSearch,
    closeDetail,
    onOpenTripChecklist,
  }: {
    detailMarker: { id: string } | null;
    dataSyncOpen: boolean;
    guideSearchOpen: boolean;
    guideSearchMarkerId: string | null;
    onOpenGuideSearchFromDetail: (query: string, scope: Scope | 'all', markerId?: string | null) => void;
    closeGuideSearch: () => void;
    closeDetail: () => void;
    onOpenTripChecklist?: (tripId: string) => void;
  }) => (
    <div>
      <div data-testid="overlay-state">{`${detailMarker?.id ?? 'none'}|${dataSyncOpen}|${guideSearchOpen}|${guideSearchMarkerId ?? 'none'}`}</div>
      <button type="button" onClick={() => onOpenGuideSearchFromDetail('杭州', 'domestic', 'marker-self')}>
        open-guide-from-detail
      </button>
      <button type="button" onClick={closeGuideSearch}>
        close-guide-search
      </button>
      <button type="button" onClick={closeDetail}>
        close-detail
      </button>
      <button type="button" onClick={() => onOpenTripChecklist?.('trip-1')}>
        open-trip-checklist
      </button>
    </div>
  ),
}));

describe('TravelApp', () => {
  const account = {
    id: 'acct-1',
    name: 'Voyage Atlas',
    username: 'demo',
    role: 'admin' as const,
  };

  const buildMapContext = () => ({
    scope: 'domestic' as const,
    setScope: vi.fn(),
    regionOptions: [{ id: '浙江', name: '浙江', cities: ['杭州'] }],
    selectedRegionId: '浙江',
    setSelectedRegionId: vi.fn(),
    selectedRegion: { id: '浙江', name: '浙江', cities: ['杭州'] },
    currentMarkers: mocks.baseStore.markers,
    visibleMarkers: [mocks.baseStore.markers[0]],
    handleScopeChange: vi.fn(),
    handleSelectRegion: vi.fn(),
    handleOpenSelectedRegionComposer: vi.fn(),
    handleClearSelectedRegion: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.remoteTravelStoreRepositoryMock.loadStore.mockResolvedValue(mocks.baseStore);
    mocks.createDefaultStoreMock.mockReturnValue(mocks.baseStore);
    mocks.useMapContextMock.mockReturnValue(buildMapContext());
    mocks.useTravelStoreActionsMock.mockImplementation((args: { showToast: (message: string, tone?: 'info' | 'success' | 'error') => void }) => ({
      activeUser: mocks.baseStore.users[0],
      handleSwitchUser: vi.fn(),
      handleCreateUser: vi.fn(),
      handleCreateTrip: vi.fn(),
      handleUpdateTrip: vi.fn(),
      handleDeleteTrip: vi.fn(),
      handleBulkAssignMarkersToTrip: vi.fn(),
      handleSubmitMarker: vi.fn(),
      handleDeleteMarker: vi.fn(async () => {
        args.showToast('已删除旅行记录。', 'success');
      }),
      handleUpdateMarker: vi.fn(),
      handleSaveGuide: vi.fn(),
      handleAttachGuideToMarker: vi.fn(),
      handleRemoveSavedGuide: vi.fn(),
      handleSaveSearchHistory: vi.fn(),
      handleGenerateTripChecklist: vi.fn(),
    }));
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    });
    window.scrollTo = vi.fn();
  });

  it('loads store data, reacts to hero/content/overlay callbacks, and updates overlay state', async () => {
    const user = userEvent.setup();
    const onOpenTripDetail = vi.fn();
    const onOpenTripChecklist = vi.fn();

    mocks.focusMarkerByIdMock
      .mockImplementationOnce(({ onBeforeFocus, onFocused, markers }: any) => {
        onBeforeFocus?.();
        onFocused?.(markers[0]);
        return markers[0];
      })
      .mockImplementationOnce(({ onFocused, markers }: any) => {
        onFocused?.(markers[1]);
        return markers[1];
      })
      .mockImplementationOnce(({ onMissing }: any) => {
        onMissing?.();
        return null;
      });

    render(
      <TravelApp
        account={account}
        onLogout={vi.fn()}
        onOpenTripDetail={onOpenTripDetail}
        onOpenTripChecklist={onOpenTripChecklist}
        entryMessage="欢迎回来"
      />,
    );

    expect(screen.getByTestId('hero-message')).toHaveTextContent('欢迎回来');
    await waitFor(() => {
      expect(mocks.remoteTravelStoreRepositoryMock.loadStore).toHaveBeenCalledOnce();
    });
    expect(screen.getByText('stats-domestic-1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'hero-open-guide' }));
    expect(screen.getByTestId('overlay-state')).toHaveTextContent('none|false|true|none');

    await user.click(screen.getByRole('button', { name: 'open-data-sync' }));
    expect(screen.getByTestId('overlay-state')).toHaveTextContent('none|true|true|none');

    await user.click(screen.getByRole('button', { name: 'view-detail' }));
    expect(screen.getByTestId('overlay-state')).toHaveTextContent('marker-self|true|true|none');

    await user.click(screen.getByRole('button', { name: 'open-guide-from-detail' }));
    expect(screen.getByTestId('overlay-state')).toHaveTextContent('none|true|true|marker-self');

    await user.click(screen.getByRole('button', { name: 'close-guide-search' }));
    expect(screen.getByTestId('overlay-state')).toHaveTextContent('none|true|false|none');

    await user.click(screen.getByRole('button', { name: 'focus-from-guide' }));
    expect(screen.getByTestId('hero-message')).toHaveTextContent('已定位到 浙江 · 杭州 的旅行记录。');

    await user.click(screen.getByRole('button', { name: 'focus-from-timeline' }));
    expect(screen.getByTestId('hero-message')).toHaveTextContent('已从时间线定位到 日本 · 京都。');

    await user.click(screen.getByRole('button', { name: 'focus-from-search' }));
    expect(screen.getByTestId('hero-message')).toHaveTextContent('搜索结果中的旅行记录已不存在。');

    await user.click(screen.getByRole('button', { name: 'open-trip-detail' }));
    expect(onOpenTripDetail).toHaveBeenCalledWith('trip-1');

    await user.click(screen.getByRole('button', { name: 'open-trip-checklist' }));
    expect(onOpenTripChecklist).toHaveBeenCalledWith('trip-1');

    Object.defineProperty(window, 'scrollY', { value: 120, writable: true, configurable: true });
    fireEvent.scroll(window);
    await user.click(screen.getByRole('button', { name: '回到主页面顶部' }));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('falls back to default store on load failure and confirms marker deletion with toast lifecycle', async () => {
    const user = userEvent.setup();
    mocks.remoteTravelStoreRepositoryMock.loadStore.mockRejectedValueOnce(new Error('load failed'));

    render(<TravelApp account={account} onLogout={vi.fn()} />);

    await waitFor(() => {
      expect(mocks.createDefaultStoreMock).toHaveBeenCalledTimes(2);
    });

    await user.click(screen.getByRole('button', { name: 'request-delete' }));
    expect(screen.getByText('确认删除这条旅行记录？')).toBeInTheDocument();
    expect(screen.getByText('删除后会从地图、时间线和详情中移除：浙江 · 杭州。')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '确认删除' }));
    await waitFor(() => {
      expect(screen.getByText('已删除旅行记录。')).toBeInTheDocument();
    });
  });
});
