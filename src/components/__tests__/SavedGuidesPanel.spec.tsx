import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SavedGuidesPanel from '../SavedGuidesPanel';
import type { SavedGuide, UserProfile, VisitMarker } from '../../types';

const users: UserProfile[] = [
  { id: 'u1', name: '小悠', color: '#2563eb' },
  { id: 'u2', name: '阿泽', color: '#f97316' },
];

const markers: VisitMarker[] = [
  {
    id: 'm1',
    userId: 'u1',
    scope: 'domestic',
    scopeId: 'zhejiang',
    scopeName: '浙江',
    city: '杭州',
    note: '西湖散步',
    visitedStartAt: '2026-05-01',
    visitedEndAt: '2026-05-02',
    createdAt: '2026-05-03T00:00:00.000Z',
  },
];

const savedGuides: SavedGuide[] = [
  {
    id: 'saved-linked',
    savedByUserId: 'u1',
    markerId: 'm1',
    keyword: '杭州 攻略',
    savedAt: '2026-05-10T00:00:00.000Z',
    result: {
      id: 'guide-linked',
      title: '杭州周末攻略',
      summary: '适合周末慢游西湖与河坊街。',
      sourceName: '示例来源',
      sourceUrl: 'https://example.com/hangzhou',
    },
  },
  {
    id: 'saved-favorite',
    savedByUserId: 'u1',
    keyword: '京都 攻略',
    savedAt: '2026-05-09T00:00:00.000Z',
    result: {
      id: 'guide-favorite',
      title: '京都赏樱攻略',
      summary: '清水寺和哲学之道赏樱路线。',
      sourceName: '示例来源',
      sourceUrl: 'https://example.com/kyoto',
    },
  },
  {
    id: 'saved-other-user',
    savedByUserId: 'u2',
    keyword: '大阪 攻略',
    savedAt: '2026-05-08T00:00:00.000Z',
    result: {
      id: 'guide-other',
      title: '大阪美食攻略',
      summary: '适合夜晚扫街。',
      sourceName: '示例来源',
      sourceUrl: 'https://example.com/osaka',
    },
  },
];

describe('SavedGuidesPanel', () => {
  it('filters saved guides and supports locating marker or removing guide', async () => {
    const onOpenMarkerDetail = vi.fn();
    const onRemoveSavedGuide = vi.fn();
    const user = userEvent.setup();

    render(
      <SavedGuidesPanel
        savedGuides={savedGuides}
        activeUserId="u1"
        users={users}
        markers={markers}
        onOpenMarkerDetail={onOpenMarkerDetail}
        onRemoveSavedGuide={onRemoveSavedGuide}
      />,
    );

    expect(screen.getByText('杭州周末攻略')).toBeInTheDocument();
    expect(screen.getByText('京都赏樱攻略')).toBeInTheDocument();
    expect(screen.queryByText('大阪美食攻略')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '已关联' }));
    expect(screen.getByText('杭州周末攻略')).toBeInTheDocument();
    expect(screen.queryByText('京都赏樱攻略')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '定位记录' }));
    expect(onOpenMarkerDetail).toHaveBeenCalledWith('m1');

    await user.click(screen.getByRole('button', { name: '移除收藏' }));
    expect(onRemoveSavedGuide).toHaveBeenCalledWith('saved-linked');

    await user.click(screen.getByRole('tab', { name: '未关联' }));
    expect(screen.getByText('京都赏樱攻略')).toBeInTheDocument();
    expect(screen.queryByText('杭州周末攻略')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '取消收藏' }));
    expect(onRemoveSavedGuide).toHaveBeenCalledWith('saved-favorite');
  });

  it('toggles the drawer content', async () => {
    const user = userEvent.setup();

    render(
      <SavedGuidesPanel
        savedGuides={savedGuides}
        activeUserId="u1"
        users={users}
        markers={markers}
        onOpenMarkerDetail={() => {}}
        onRemoveSavedGuide={() => {}}
      />,
    );

    const toggleButton = screen.getByRole('button', { name: /收起/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('tablist', { name: '攻略收藏筛选' })).toBeInTheDocument();

    await user.click(toggleButton);
    expect(screen.getByRole('button', { name: /展开/i })).toHaveAttribute('aria-expanded', 'false');

    const drawer = screen.getByRole('button', { name: /展开/i }).getAttribute('aria-controls');
    expect(drawer).toBe('saved-guides-drawer');
  });
});
