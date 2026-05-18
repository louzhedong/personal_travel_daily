import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyOrganizationAction,
  fetchOrganizationWorkbench,
  previewOrganizationAction,
} from '../../lib/api/organizationApi';
import type { OrganizationWorkbenchResponseDto } from '../../lib/api/types';
import OrganizationWorkbenchPage from '../organize/OrganizationWorkbenchPage';

vi.mock('../../lib/api/organizationApi', () => ({
  fetchOrganizationWorkbench: vi.fn(),
  previewOrganizationAction: vi.fn(),
  applyOrganizationAction: vi.fn(),
}));

const account = { id: 'acct-1', name: 'Voyage Atlas', username: 'demo', role: 'member' as const };

const workbench: OrganizationWorkbenchResponseDto = {
  summary: {
    totalIssues: 4,
    unassignedMarkers: 1,
    missingPhotoCaptions: 1,
    unlinkedGuides: 0,
    unfeaturedPhotos: 1,
    weakMarkerTags: 1,
    readyTrips: 1,
  },
  tripOptions: [{ id: 'trip-1', name: '杭州周末', startsAt: '2026-05-01T00:00:00.000Z', endsAt: '2026-05-03T00:00:00.000Z' }],
  sections: {
    unassignedMarkers: [{ id: 'unassignedMarker:marker-1', kind: 'unassignedMarker', targetId: 'marker-1', markerId: 'marker-1', title: '浙江 · 杭州', description: '还没有归入任何行程。', actionHint: '批量归入行程', occurredAt: '2026-05-01T00:00:00.000Z' }],
    missingPhotoCaptions: [{ id: 'missingPhotoCaption:image-1', kind: 'missingPhotoCaption', targetId: 'image-1', markerId: 'marker-1', title: '浙江 · 杭州', description: '缺少说明。', actionHint: '生成说明草稿', occurredAt: '2026-05-01T00:00:00.000Z', imageUrl: 'https://example.com/a.jpg' }],
    unlinkedGuides: [],
    unfeaturedPhotos: [{ id: 'unfeaturedPhoto:image-1', kind: 'unfeaturedPhoto', targetId: 'image-1', markerId: 'marker-1', title: '浙江 · 杭州', description: '还没有精选。', actionHint: '标记为精选', occurredAt: '2026-05-01T00:00:00.000Z' }],
    weakMarkerTags: [{ id: 'weakMarkerTags:marker-1', kind: 'weakMarkerTags', targetId: 'marker-1', markerId: 'marker-1', title: '浙江 · 杭州', description: '缺少标签。', actionHint: '批量补标签', occurredAt: '2026-05-01T00:00:00.000Z', tags: [] }],
  },
  generatedAt: '2026-05-12T00:00:00.000Z',
};

describe('OrganizationWorkbenchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchOrganizationWorkbench).mockResolvedValue(workbench);
    vi.mocked(previewOrganizationAction).mockResolvedValue({
      actionType: 'assignMarkersToTrip',
      dryRun: true,
      changeCount: 1,
      changes: [{ targetId: 'marker-1', targetTitle: '浙江 · 杭州', before: '未归入行程', after: '杭州周末' }],
    });
    vi.mocked(applyOrganizationAction).mockResolvedValue({
      actionType: 'assignMarkersToTrip',
      dryRun: false,
      applied: true,
      changeCount: 1,
      changes: [{ targetId: 'marker-1', targetTitle: '浙江 · 杭州', before: '未归入行程', after: '杭州周末' }],
      workbench: { ...workbench, summary: { ...workbench.summary, totalIssues: 3, unassignedMarkers: 0 } },
    });
  });

  it('renders summary, sections, and dry-run controls', async () => {
    render(<OrganizationWorkbenchPage account={account} onLogout={vi.fn()} onNavigateBack={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: '整理工作台' })).toBeInTheDocument();
    expect(screen.getByText('4 项待整理 · 1 个可归档行程')).toBeInTheDocument();
    expect(screen.getByText('未归行程记录')).toBeInTheDocument();
    expect(screen.getAllByText('浙江 · 杭州').length).toBeGreaterThan(0);
    expect(fetchOrganizationWorkbench).toHaveBeenCalledOnce();
  });

  it('previews and applies an action only after confirmation', async () => {
    const user = userEvent.setup();
    render(<OrganizationWorkbenchPage account={account} onLogout={vi.fn()} onNavigateBack={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: '预览归行程' }));

    expect(previewOrganizationAction).toHaveBeenCalledWith({
      type: 'assignMarkersToTrip',
      tripId: 'trip-1',
      markerIds: ['marker-1'],
    });
    expect(applyOrganizationAction).not.toHaveBeenCalled();
    expect(await screen.findByText('1 项变更待确认')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '确认执行' }));

    await waitFor(() => {
      expect(applyOrganizationAction).toHaveBeenCalledWith({
        type: 'assignMarkersToTrip',
        tripId: 'trip-1',
        markerIds: ['marker-1'],
      });
    });
    expect(await screen.findByText('整理动作已执行')).toBeInTheDocument();
  });
});
