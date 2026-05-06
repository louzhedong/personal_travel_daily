import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuideSearchPanel from '../GuideSearchPanel';
import type { SavedGuide, TripCollection } from '../../types';

const mocks = vi.hoisted(() => ({
  searchGuidesMock: vi.fn(),
  getGuideDocumentMock: vi.fn(),
  useGuideSearchLayoutLockMock: vi.fn(),
  fetchGuideSourceHealthMock: vi.fn(),
}));

vi.mock('../../lib/guides/guideSearchService', () => ({
  searchGuides: mocks.searchGuidesMock,
}));

vi.mock('../../lib/guides/guideContentService', () => ({
  getGuideDocument: mocks.getGuideDocumentMock,
}));

vi.mock('../../lib/api/guideSourceHealthApi', () => ({
  fetchGuideSourceHealth: mocks.fetchGuideSourceHealthMock,
}));

vi.mock('../useGuideSearchLayoutLock', () => ({
  useGuideSearchLayoutLock: mocks.useGuideSearchLayoutLockMock,
}));

describe('GuideSearchPanel', () => {
  const onSaveSearchHistory = vi.fn(async () => []);
  const onGenerateTripChecklist = vi.fn(async () => ({ createdCount: 4 }));
  const searchResult = {
    id: 'mock-guide-1',
    title: 'Kyoto Spring Cherry Blossom Guide',
    summary: 'Cherry blossom timing, popular viewpoints and quiet morning walking route.',
    sourceName: 'Mock Guide',
    sourceUrl: 'https://mock.example.com/guides/kyoto-spring',
    destinationLabel: '京都',
  };
  const document = {
    id: 'guide-doc-1',
    title: 'Kyoto Spring Cherry Blossom Guide',
    summary: 'Cherry blossom walks with a relaxed pace',
    sourceName: 'Mock Guide',
    sourceUrl: 'https://mock.example.com/guides/kyoto-spring',
    fetchedAt: '2026-04-01T00:00:00.000Z',
    aiSummary: {
      highlights: ['Cherry blossom walks with a relaxed pace'],
      routeTips: ['Late March to early April'],
      transportTips: [],
      warnings: [],
    },
    blocks: [{ id: 'best-season', type: 'heading', text: 'Best Season' }],
    contentHtml:
      '<h2 id="best-season">Best Season</h2><p>Three days works well for first-time visitors.</p>',
  };
  const trips: TripCollection[] = [
    {
      id: 'trip-1',
      name: '京都春日行',
      note: '',
      startsAt: '2026-04-01',
      endsAt: '2026-04-05',
      createdAt: '2026-03-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_GUIDE_SEARCH_PROVIDER', 'mock');
    HTMLElement.prototype.scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollTo = vi.fn();
    onSaveSearchHistory.mockClear();
    onGenerateTripChecklist.mockClear();
    mocks.searchGuidesMock.mockReset();
    mocks.getGuideDocumentMock.mockReset();
    mocks.useGuideSearchLayoutLockMock.mockReset();
    mocks.searchGuidesMock.mockResolvedValue({
      items: [searchResult],
      provider: 'mock',
      page: 1,
      hasMore: false,
    });
    mocks.getGuideDocumentMock.mockResolvedValue(document);
    mocks.fetchGuideSourceHealthMock.mockResolvedValue({ items: [] });
    mocks.useGuideSearchLayoutLockMock.mockReturnValue({
      layoutLocked: false,
      panelSpacerHeight: 0,
    });
  });

  it('applies drawer animation classes when opened', async () => {
    render(
      <GuideSearchPanel
        open
        initialQuery="Kyoto"
        initialScope="international"
        activeUserId="u1"
        linkedMarkerId={null}
        savedGuides={[]}
        onClose={() => {}}
        onSaveGuide={() => {}}
        onAttachGuideToMarker={() => {}}
        onRemoveSavedGuide={() => {}}
        searchHistory={[]}
        onSaveSearchHistory={onSaveSearchHistory}
        trips={trips}
        onGenerateTripChecklist={onGenerateTripChecklist}
        onOpenTripDetail={() => {}}
        onOpenTripChecklist={() => {}}
      />,
    );

    const panel = screen.getByLabelText('攻略搜索');
    expect(panel.className).toContain('guide-search-panel');

    await waitFor(() => {
      expect(panel.className).toContain('is-visible');
    });
  });

  it('searches and renders guide result details', async () => {
    const onSaveGuide = vi.fn();
    const onAttachGuideToMarker = vi.fn();
    const onRemoveSavedGuide = vi.fn();
    render(
      <GuideSearchPanel
        open
        initialQuery="Kyoto"
        initialScope="international"
        activeUserId="u1"
        linkedMarkerId={null}
        savedGuides={[]}
        onClose={() => {}}
        onSaveGuide={onSaveGuide}
        onAttachGuideToMarker={onAttachGuideToMarker}
        onRemoveSavedGuide={onRemoveSavedGuide}
        searchHistory={[]}
        onSaveSearchHistory={onSaveSearchHistory}
        trips={trips}
        onGenerateTripChecklist={onGenerateTripChecklist}
        onOpenTripDetail={() => {}}
        onOpenTripChecklist={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '搜索' }));

    expect(await screen.findByRole('heading', { name: /Kyoto Spring Cherry Blossom Guide/i })).toBeInTheDocument();
    expect(screen.getByText('Cherry blossom timing, popular viewpoints and quiet morning walking route.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '收藏攻略' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '关联到当前记录' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '查看片段' }));

    expect(await screen.findByText('Best Season')).toBeInTheDocument();
    expect(screen.getByText('攻略速览')).toBeInTheDocument();
    expect(screen.getByText('Cherry blossom walks with a relaxed pace')).toBeInTheDocument();
    expect(screen.getByText(/Late March to early April/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    });

    await userEvent.click(screen.getByRole('button', { name: '原文' }));
    expect(screen.getByText(/Three days works well for first-time visitors/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '在原网站查看完整页面' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '原文' })).toHaveClass('active');

    await userEvent.click(screen.getByRole('button', { name: '收藏攻略' }));
    expect(onSaveGuide).toHaveBeenCalledTimes(1);
    expect(onAttachGuideToMarker).not.toHaveBeenCalled();
    expect(onRemoveSavedGuide).not.toHaveBeenCalled();
  });

  it('passes keyword mode when smart search is turned off', async () => {
    render(
      <GuideSearchPanel
        open
        initialQuery="Kyoto"
        initialScope="international"
        activeUserId="u1"
        linkedMarkerId={null}
        savedGuides={[]}
        onClose={() => {}}
        onSaveGuide={() => {}}
        onAttachGuideToMarker={() => {}}
        onRemoveSavedGuide={() => {}}
        searchHistory={[]}
        onSaveSearchHistory={onSaveSearchHistory}
        trips={trips}
        onGenerateTripChecklist={onGenerateTripChecklist}
        onOpenTripDetail={() => {}}
        onOpenTripChecklist={() => {}}
      />,
    );

    await userEvent.click(screen.getByLabelText('智能搜索'));
    await userEvent.click(screen.getByRole('button', { name: '搜索' }));

    expect(await screen.findByRole('heading', { name: /Kyoto Spring Cherry Blossom Guide/i })).toBeInTheDocument();
    expect(screen.queryByText('Semantic match for a relaxed spring route')).not.toBeInTheDocument();
  });

  it('auto searches on open when requested', async () => {
    render(
      <GuideSearchPanel
        open
        initialQuery="Kyoto"
        initialScope="international"
        autoSearchOnOpen
        activeUserId="u1"
        linkedMarkerId={null}
        savedGuides={[]}
        onClose={() => {}}
        onSaveGuide={() => {}}
        onAttachGuideToMarker={() => {}}
        onRemoveSavedGuide={() => {}}
        searchHistory={[]}
        onSaveSearchHistory={onSaveSearchHistory}
        trips={trips}
        onGenerateTripChecklist={onGenerateTripChecklist}
        onOpenTripDetail={() => {}}
        onOpenTripChecklist={() => {}}
      />,
    );

    expect(await screen.findByRole('heading', { name: /Kyoto Spring Cherry Blossom Guide/i })).toBeInTheDocument();
    expect(screen.getByText('来源: mock')).toBeInTheDocument();
  });

  it('renders linked marker actions and toggles by saved status', async () => {
    const onSaveGuide = vi.fn();
    const onAttachGuideToMarker = vi.fn();
    const onRemoveSavedGuide = vi.fn();

    const savedGuides: SavedGuide[] = [
      {
        id: 'saved-favorite',
        savedByUserId: 'u1',
        keyword: 'kyoto',
        savedAt: '2026-04-20T00:00:00.000Z',
        result: {
          id: 'mock-guide-1',
          title: 'Kyoto Spring Cherry Blossom Guide',
          summary: 'Cherry blossom timing, popular viewpoints and quiet morning walking route.',
          sourceName: 'Mock Guide',
          sourceUrl: 'https://mock.example.com/guides/kyoto-spring',
        },
      },
      {
        id: 'saved-marker',
        savedByUserId: 'u1',
        markerId: 'marker-1',
        keyword: 'kyoto',
        savedAt: '2026-04-20T00:00:00.000Z',
        result: {
          id: 'mock-guide-1',
          title: 'Kyoto Spring Cherry Blossom Guide',
          summary: 'Cherry blossom timing, popular viewpoints and quiet morning walking route.',
          sourceName: 'Mock Guide',
          sourceUrl: 'https://mock.example.com/guides/kyoto-spring',
        },
      },
    ];

    render(
      <GuideSearchPanel
        open
        initialQuery="Kyoto"
        initialScope="international"
        activeUserId="u1"
        linkedMarkerId="marker-1"
        savedGuides={savedGuides}
        onClose={() => {}}
        onSaveGuide={onSaveGuide}
        onAttachGuideToMarker={onAttachGuideToMarker}
        onRemoveSavedGuide={onRemoveSavedGuide}
        searchHistory={[]}
        onSaveSearchHistory={onSaveSearchHistory}
        trips={trips}
        onGenerateTripChecklist={onGenerateTripChecklist}
        onOpenTripDetail={() => {}}
        onOpenTripChecklist={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '搜索' }));
    expect(await screen.findByRole('heading', { name: /Kyoto Spring Cherry Blossom Guide/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '取消收藏' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '解除关联' })).toBeInTheDocument();
    expect(screen.getByText('已收藏')).toBeInTheDocument();
    expect(screen.getByText('已关联当前记录')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '取消收藏' }));
    await userEvent.click(screen.getByRole('button', { name: '解除关联' }));
    expect(onRemoveSavedGuide).toHaveBeenCalledWith('saved-favorite');
    expect(onRemoveSavedGuide).toHaveBeenCalledWith('saved-marker');
  });

  it('generates a trip checklist from a search result after choosing a trip', async () => {
    render(
      <GuideSearchPanel
        open
        initialQuery="Kyoto"
        initialScope="international"
        activeUserId="u1"
        linkedMarkerId={null}
        savedGuides={[]}
        onClose={() => {}}
        onSaveGuide={() => {}}
        onAttachGuideToMarker={() => {}}
        onRemoveSavedGuide={() => {}}
        searchHistory={[]}
        onSaveSearchHistory={onSaveSearchHistory}
        trips={trips}
        onGenerateTripChecklist={onGenerateTripChecklist}
        onOpenTripDetail={() => {}}
        onOpenTripChecklist={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '搜索' }));
    expect(await screen.findByRole('heading', { name: /Kyoto Spring Cherry Blossom Guide/i })).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: '生成行前清单' })[0]);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: '生成行前清单' })[1]);

    await waitFor(() => {
      expect(onGenerateTripChecklist).toHaveBeenCalledWith(
        'trip-1',
        expect.objectContaining({ title: 'Kyoto Spring Cherry Blossom Guide' }),
      );
    });

    expect(screen.getByText(/已为《Kyoto Spring Cherry Blossom Guide》在行程《京都春日行》中生成 4 条行前清单/)).toBeInTheDocument();
  });

  it('shows document fallback and load error states', async () => {
    mocks.getGuideDocumentMock
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('正文加载失败'));

    render(
      <GuideSearchPanel
        open
        initialQuery="Kyoto"
        initialScope="international"
        activeUserId="u1"
        linkedMarkerId={null}
        savedGuides={[]}
        onClose={() => {}}
        onSaveGuide={() => {}}
        onAttachGuideToMarker={() => {}}
        onRemoveSavedGuide={() => {}}
        searchHistory={[]}
        onSaveSearchHistory={onSaveSearchHistory}
        trips={trips}
        onGenerateTripChecklist={onGenerateTripChecklist}
        onOpenTripDetail={() => {}}
        onOpenTripChecklist={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '搜索' }));
    await userEvent.click(screen.getByRole('button', { name: '查看片段' }));
    expect(await screen.findByText('当前只有摘要，暂时还没有可展示的正文片段。')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '查看片段' }));
    expect(await screen.findByText('正文加载失败')).toBeInTheDocument();
  });

  it('shows failure feedback when checklist generation fails', async () => {
    const failingGenerate = vi.fn().mockRejectedValue(new Error('生成失败'));

    render(
      <GuideSearchPanel
        open
        initialQuery="Kyoto"
        initialScope="international"
        activeUserId="u1"
        linkedMarkerId={null}
        savedGuides={[]}
        onClose={() => {}}
        onSaveGuide={() => {}}
        onAttachGuideToMarker={() => {}}
        onRemoveSavedGuide={() => {}}
        searchHistory={[]}
        onSaveSearchHistory={onSaveSearchHistory}
        trips={trips}
        onGenerateTripChecklist={failingGenerate}
        onOpenTripDetail={() => {}}
        onOpenTripChecklist={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '搜索' }));
    await userEvent.click(screen.getAllByRole('button', { name: '生成行前清单' })[0]);
    await userEvent.click(screen.getAllByRole('button', { name: '生成行前清单' })[1]);
    await waitFor(() => {
      expect(screen.getAllByText('生成失败').length).toBeGreaterThan(0);
    });
  });

  it('opens generated checklist feedback actions and supports closing from backdrop and escape', async () => {
    const onClose = vi.fn();
    const onOpenTripDetail = vi.fn();
    const onOpenTripChecklist = vi.fn();

    render(
      <GuideSearchPanel
        open
        initialQuery="Kyoto"
        initialScope="international"
        autoSearchOnOpen
        activeUserId="u1"
        linkedMarkerId={null}
        savedGuides={[]}
        onClose={onClose}
        onSaveGuide={() => {}}
        onAttachGuideToMarker={() => {}}
        onRemoveSavedGuide={() => {}}
        searchHistory={[]}
        onSaveSearchHistory={onSaveSearchHistory}
        trips={trips}
        onGenerateTripChecklist={onGenerateTripChecklist}
        onOpenTripDetail={onOpenTripDetail}
        onOpenTripChecklist={onOpenTripChecklist}
      />,
    );

    await screen.findByRole('heading', { name: /Kyoto Spring Cherry Blossom Guide/i });
    await userEvent.click(screen.getByRole('button', { name: '生成行前清单' }));
    await userEvent.click(screen.getAllByRole('button', { name: '生成行前清单' })[1]);
    await screen.findByRole('button', { name: '查看行程详情' });

    await userEvent.click(screen.getByRole('button', { name: '查看行程详情' }));
    await userEvent.click(screen.getByRole('button', { name: '打开行前清单' }));
    expect(onOpenTripDetail).toHaveBeenCalledWith('trip-1');
    expect(onOpenTripChecklist).toHaveBeenCalledWith('trip-1');

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByText('查看行程详情').closest('.guide-search-panel')!.parentElement!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
