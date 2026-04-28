import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuideSearchPanel from '../GuideSearchPanel';
import type { SavedGuide, TripCollection } from '../../types';

describe('GuideSearchPanel', () => {
  const onSaveSearchHistory = vi.fn(async () => []);
  const onGenerateTripChecklist = vi.fn(async () => ({ createdCount: 4 }));
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

    expect(await screen.findByText('Kyoto Spring Cherry Blossom Guide')).toBeInTheDocument();
    expect(screen.getByText('Semantic match for a relaxed spring route')).toBeInTheDocument();
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
    expect(screen.getByText('正文目录')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Best Season' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '回到顶部' })).toBeInTheDocument();

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

    expect(await screen.findByText('Kyoto Spring Cherry Blossom Guide')).toBeInTheDocument();
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

    expect(await screen.findByText('Kyoto Spring Cherry Blossom Guide')).toBeInTheDocument();
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
    expect(await screen.findByText('Kyoto Spring Cherry Blossom Guide')).toBeInTheDocument();
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
    expect(await screen.findByText('Kyoto Spring Cherry Blossom Guide')).toBeInTheDocument();

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
});
