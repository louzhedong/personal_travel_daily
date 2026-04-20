import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarkerDetailPanel from '../MarkerDetailPanel';
import type { SavedGuide, UserProfile, VisitMarker } from '../../types';

const user: UserProfile = { id: 'u1', name: '小悠', color: '#2563eb' };

const marker: VisitMarker = {
  id: 'm1',
  userId: 'u1',
  scope: 'domestic',
  scopeId: '青海',
  scopeName: '青海',
  city: '西宁',
  note: '原始描述',
  imageUrls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
  visitedStartAt: '2026-05-01',
  visitedEndAt: '2026-05-03',
  createdAt: '2026-05-04T00:00:00.000Z',
};

describe('MarkerDetailPanel', () => {
  it('allows editing note and saving changes', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);

    render(
      <MarkerDetailPanel
        marker={marker}
        user={user}
        open
        canEdit
        onClose={() => {}}
        onUpdate={onUpdate}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '编辑记录' }));
    expect(screen.getByRole('button', { name: '保存修改' })).toBeDisabled();

    const textarea = screen.getByPlaceholderText('补充这次旅行中最值得留下的记忆');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, '新的旅行描述');
    expect(screen.getByRole('button', { name: '保存修改' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: '保存修改' }));

    expect(onUpdate).toHaveBeenCalledWith('m1', {
      note: '新的旅行描述',
      imageUrls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
    });
    expect(await screen.findByRole('button', { name: '编辑记录' })).toBeInTheDocument();
  });

  it('supports keyboard navigation and escape close in lightbox', async () => {
    render(
      <MarkerDetailPanel
        marker={marker}
        user={user}
        open
        canEdit
        onClose={() => {}}
        onUpdate={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '青海-西宁-1' }));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByText('1 / 2')).not.toBeInTheDocument();
  });

  it('opens guide search from the detail panel', async () => {
    const onOpenGuideSearch = vi.fn();

    render(
      <MarkerDetailPanel
        marker={marker}
        user={user}
        open
        canEdit
        onClose={() => {}}
        onUpdate={() => {}}
        onOpenGuideSearch={onOpenGuideSearch}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '查找攻略' }));

    expect(onOpenGuideSearch).toHaveBeenCalledWith('青海 西宁 攻略', 'domestic');
  });

  it('shows related guides and allows unlinking', async () => {
    const relatedGuides: SavedGuide[] = [
      {
        id: 'saved-1',
        savedByUserId: 'u1',
        markerId: 'm1',
        keyword: '青海',
        savedAt: '2026-05-04T00:00:00.000Z',
        result: {
          id: 'guide-1',
          title: '青海湖环线攻略',
          summary: '经典环线路线和高原适应建议。',
          sourceName: '示例来源',
          sourceUrl: 'https://example.com/guide/1',
        },
      },
    ];
    const onRemoveRelatedGuide = vi.fn();

    render(
      <MarkerDetailPanel
        marker={marker}
        user={user}
        open
        canEdit
        onClose={() => {}}
        onUpdate={() => {}}
        relatedGuides={relatedGuides}
        onRemoveRelatedGuide={onRemoveRelatedGuide}
      />,
    );

    expect(screen.getByText('相关攻略')).toBeInTheDocument();
    expect(screen.getByText('青海湖环线攻略')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '查看原文' })).toHaveAttribute(
      'href',
      'https://example.com/guide/1',
    );

    await userEvent.click(screen.getByRole('button', { name: '解除关联' }));
    expect(onRemoveRelatedGuide).toHaveBeenCalledWith('saved-1');
  });
});
