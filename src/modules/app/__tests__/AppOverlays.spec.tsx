import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AppOverlays from '../AppOverlays';
import type { Scope, TravelStore } from '../../../types';

const mocks = vi.hoisted(() => ({
  markerFormMock: vi.fn(),
  dataSyncMock: vi.fn(),
  markerDetailPanelMock: vi.fn(),
  guideSearchPanelMock: vi.fn(),
}));

vi.mock('../../../components/MarkerForm', () => ({
  default: (props: unknown) => {
    mocks.markerFormMock(props);
    return <div data-testid="marker-form">marker-form</div>;
  },
}));

vi.mock('../../../components/DataSync', () => ({
  default: (props: unknown) => {
    mocks.dataSyncMock(props);
    return <div data-testid="data-sync">data-sync</div>;
  },
}));

vi.mock('../../../components/MarkerDetailPanel', () => ({
  default: (props: unknown) => {
    mocks.markerDetailPanelMock(props);
    return <div data-testid="marker-detail-panel">marker-detail-panel</div>;
  },
}));

vi.mock('../../../components/GuideSearchPanel', () => ({
  default: (props: unknown) => {
    mocks.guideSearchPanelMock(props);
    return <div data-testid="guide-search-panel">guide-search-panel</div>;
  },
}));

const store: TravelStore = {
  users: [{ id: 'u1', name: '小悠', color: '#2563eb' }],
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
  markers: [],
  savedGuides: [],
  guideSearchHistory: [],
};

function createBaseProps(overrides: Partial<React.ComponentProps<typeof AppOverlays>> = {}) {
  return {
    markerModalOpen: false,
    saving: false,
    closeMarkerModal: vi.fn(),
    scope: 'domestic',
    selectedRegionId: '',
    regions: [{ id: '浙江', name: '浙江', cities: ['杭州'] }],
    selectedRegion: undefined,
    activeUser: store.users[0],
    onSubmitMarker: vi.fn(),
    dataSyncOpen: false,
    closeDataSync: vi.fn(),
    store,
    detailMarker: null,
    detailUser: store.users[0],
    detailMarkerGuides: [],
    closeDetail: vi.fn(),
    onUpdateMarker: vi.fn(),
    onRemoveSavedGuide: vi.fn(),
    onOpenGuideSearchFromDetail: vi.fn(),
    guideSearchOpen: false,
    guideSearchQuery: '京都',
    guideSearchScope: 'all',
    guideSearchAutoSearch: false,
    guideSearchMarkerId: null,
    savedGuides: [],
    activeUserId: 'u1',
    closeGuideSearch: vi.fn(),
    onSaveGuide: vi.fn(),
    onAttachGuideToMarker: vi.fn(),
    guideSearchHistory: [],
    onSaveSearchHistory: vi.fn(),
    onGenerateTripChecklist: vi.fn(),
    onOpenTripDetail: vi.fn(),
    onOpenTripChecklist: vi.fn(),
    ...overrides,
  } satisfies React.ComponentProps<typeof AppOverlays>;
}

function renderOverlays(overrides: Partial<React.ComponentProps<typeof AppOverlays>> = {}) {
  const props = createBaseProps(overrides);

  return {
    ...render(<AppOverlays {...props} />),
    props,
  };
}

describe('AppOverlays', () => {
  it('renders the marker modal and passes selected region defaults into MarkerForm', () => {
    renderOverlays({
      markerModalOpen: true,
      selectedRegionId: '浙江',
      selectedRegion: { id: '浙江', name: '浙江', cities: ['杭州'] },
    });

    expect(screen.getByText('添加旅行标记')).toBeInTheDocument();
    expect(screen.getByTestId('marker-form')).toBeInTheDocument();
    expect(mocks.markerFormMock).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: 'domestic' satisfies Scope,
        initialValue: {
          scopeId: '浙江',
          scopeName: '浙江',
        },
        submitText: '保存到 小悠',
      }),
    );
  });

  it('closes the marker modal from backdrop and close button only when not saving', () => {
    const closeMarkerModal = vi.fn();
    const { rerender, container } = renderOverlays({
      markerModalOpen: true,
      closeMarkerModal,
      saving: false,
    });

    fireEvent.click(container.querySelector('.modal-backdrop')!);
    fireEvent.click(screen.getByRole('button', { name: '关闭弹窗' }));
    expect(closeMarkerModal).toHaveBeenCalledTimes(2);

    rerender(
      <AppOverlays
        {...createBaseProps({
          markerModalOpen: true,
          closeMarkerModal,
          saving: false,
        })}
        markerModalOpen
        closeMarkerModal={closeMarkerModal}
        saving
      />,
    );

    fireEvent.click(container.querySelector('.modal-backdrop')!);
    fireEvent.click(screen.getByRole('button', { name: '关闭弹窗' }));
    expect(closeMarkerModal).toHaveBeenCalledTimes(2);
  });

  it('renders data sync, marker detail, and guide search children with derived props', () => {
    const onOpenGuideSearchFromDetail = vi.fn();
    renderOverlays({
      dataSyncOpen: true,
      guideSearchOpen: true,
      guideSearchAutoSearch: true,
      guideSearchMarkerId: 'marker-1',
      detailMarker: {
        id: 'marker-1',
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
      onOpenGuideSearchFromDetail,
      detailMarkerGuides: [
        {
          id: 'saved-1',
          savedByUserId: 'u1',
          markerId: 'marker-1',
          keyword: '杭州',
          savedAt: '2026-04-01T00:00:00.000Z',
          result: {
            id: 'guide-1',
            title: '杭州周末',
            summary: '西湖路线',
            sourceName: 'Mock',
            sourceUrl: 'https://example.com/guide',
          },
        },
      ],
    });

    expect(screen.getByTestId('data-sync')).toBeInTheDocument();
    expect(mocks.dataSyncMock).toHaveBeenCalledWith(expect.objectContaining({ store, variant: 'dialog' }));
    expect(mocks.markerDetailPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        open: true,
        canEdit: true,
        relatedGuides: expect.any(Array),
      }),
    );
    expect(mocks.guideSearchPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        open: true,
        initialQuery: '京都',
        autoSearchOnOpen: true,
        linkedMarkerId: 'marker-1',
        trips: store.trips,
      }),
    );
  });
});
