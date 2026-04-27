import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarkerDetailPanel from '../MarkerDetailPanel';
import type { SavedGuide, TripCollection, UserProfile, VisitMarker } from '../../types';

vi.mock('../../lib/imageUpload', () => ({
  uploadImageToImgBB: vi.fn(),
}));

vi.mock('../ui/FancySelect', () => ({
  default: function MockFancySelect({
    value,
    onChange,
    options,
    ariaLabel,
    placeholder,
  }: {
    value: string;
    onChange: (nextValue: string) => void;
    options: Array<{ value: string; label: string }>;
    ariaLabel?: string;
    placeholder?: string;
  }) {
    return (
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder ?? ''}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  },
}));

const user: UserProfile = { id: 'u1', name: '小悠', color: '#2563eb' };

const trips: TripCollection[] = [
  {
    id: 'trip-1',
    name: '青海湖环线',
    note: '',
    startsAt: '2026-05-01',
    endsAt: '2026-05-05',
    createdAt: '2026-04-23T00:00:00.000Z',
  },
];

const marker: VisitMarker = {
  id: 'm1',
  userId: 'u1',
  scope: 'domestic',
  scopeId: '青海',
  scopeName: '青海',
  city: '西宁',
  note: '原始描述',
  tags: ['nature', 'photography'],
  mood: 'relaxed',
  weather: 'sunny',
  transport: 'car',
  budgetLevel: 'medium',
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
        trips={trips}
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
      tags: ['nature', 'photography'],
      mood: 'relaxed',
      weather: 'sunny',
      transport: 'car',
      budgetLevel: 'medium',
      imageUrls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
      tripId: null,
    });
    expect(await screen.findByRole('button', { name: '编辑记录' })).toBeInTheDocument();
  });

  it('allows assigning an existing marker to a trip', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);

    render(
      <MarkerDetailPanel
        marker={marker}
        user={user}
        open
        canEdit
        trips={trips}
        onClose={() => {}}
        onUpdate={onUpdate}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '编辑记录' }));
    await userEvent.selectOptions(screen.getByRole('combobox', { name: '所属行程' }), 'trip-1');
    await userEvent.click(screen.getByRole('button', { name: '保存修改' }));

    expect(onUpdate).toHaveBeenCalledWith('m1', {
      note: '原始描述',
      tags: ['nature', 'photography'],
      mood: 'relaxed',
      weather: 'sunny',
      transport: 'car',
      budgetLevel: 'medium',
      imageUrls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
      tripId: 'trip-1',
    });
  });

  it('shows marker tags and metadata in read mode', () => {
    render(
      <MarkerDetailPanel
        marker={marker}
        user={user}
        open
        canEdit
        trips={trips}
        onClose={() => {}}
        onUpdate={() => {}}
      />,
    );

    expect(screen.getByText('标签与元数据')).toBeInTheDocument();
    expect(screen.getByText('自然风景')).toBeInTheDocument();
    expect(screen.getByText('摄影')).toBeInTheDocument();
    expect(screen.getByText('放松')).toBeInTheDocument();
    expect(screen.getByText('晴')).toBeInTheDocument();
    expect(screen.getByText('自驾')).toBeInTheDocument();
    expect(screen.getByText('中预算')).toBeInTheDocument();
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

  it('keeps guide search available for read-only records without showing unlink actions', () => {
    const relatedGuides: SavedGuide[] = [
      {
        id: 'saved-1',
        savedByUserId: 'u2',
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
    const onOpenGuideSearch = vi.fn();

    render(
      <MarkerDetailPanel
        marker={marker}
        user={user}
        open
        canEdit={false}
        onClose={() => {}}
        onUpdate={() => {}}
        relatedGuides={relatedGuides}
        onOpenGuideSearch={onOpenGuideSearch}
      />,
    );

    expect(screen.getByRole('button', { name: '查找攻略' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '解除关联' })).not.toBeInTheDocument();
  });
});
