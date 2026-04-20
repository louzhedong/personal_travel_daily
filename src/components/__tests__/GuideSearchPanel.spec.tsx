import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuideSearchPanel from '../GuideSearchPanel';
import type { SavedGuide } from '../../types';

describe('GuideSearchPanel', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_GUIDE_SEARCH_PROVIDER', 'mock');
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
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '搜索' }));

    expect(await screen.findByText('Kyoto Spring Cherry Blossom Guide')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '收藏攻略' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '关联到当前记录' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '查看片段' }));

    expect(await screen.findByText('Best Season')).toBeInTheDocument();
    expect(screen.getByText(/Late March to early April/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '收藏攻略' }));
    expect(onSaveGuide).toHaveBeenCalledTimes(1);
    expect(onAttachGuideToMarker).not.toHaveBeenCalled();
    expect(onRemoveSavedGuide).not.toHaveBeenCalled();
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
});
