import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryCapsule, listMemoryCapsules } from '../../lib/api/memoryCapsulesApi';
import MemoryCapsuleCenterPage from '../capsules/MemoryCapsuleCenterPage';

vi.mock('../../lib/api/memoryCapsulesApi', () => ({
  listMemoryCapsules: vi.fn(),
  createMemoryCapsule: vi.fn(),
  duplicateMemoryCapsule: vi.fn(),
  archiveMemoryCapsule: vi.fn(),
}));

describe('MemoryCapsuleCenterPage', () => {
  const account = { id: 'acct-1', name: 'Voyage Atlas', username: 'demo', role: 'member' as const };

  it('lists capsules and creates a new capsule', async () => {
    vi.mocked(listMemoryCapsules).mockResolvedValue({
      capsules: [
        {
          id: 'capsule-1',
          type: 'trip',
          targetId: 'trip-1',
          targetLabel: '江南春游',
          title: '江南春游',
          template: 'editorial',
          status: 'draft',
          createdAt: '2026-05-11T00:00:00.000Z',
          updatedAt: '2026-05-11T00:00:00.000Z',
        },
      ],
    });
    vi.mocked(createMemoryCapsule).mockResolvedValue({
      capsule: {
        capsule: {
          id: 'capsule-2',
          type: 'annual',
          targetId: '2026',
          targetLabel: '2026 年度旅行胶囊',
          title: '2026 年度旅行胶囊',
          template: 'editorial',
          status: 'draft',
          createdAt: '2026-05-11T00:00:00.000Z',
          updatedAt: '2026-05-11T00:00:00.000Z',
        },
        config: { exportPreset: 'balanced', sections: [], photos: [], badges: [] },
        content: {
          hero: { eyebrow: 'Year Capsule', title: '2026 年度旅行胶囊' },
          metrics: [],
          badges: [],
          sections: [],
          route: [],
          timeline: [],
          photos: [],
          guides: [],
          checklist: [],
          achievements: [],
          sourceLinks: [],
          emptyStates: [],
        },
      },
    });
    const onOpenCapsule = vi.fn();

    render(
      <MemoryCapsuleCenterPage
        account={account}
        onLogout={vi.fn()}
        onNavigateBack={vi.fn()}
        onOpenCapsule={onOpenCapsule}
      />,
    );

    expect(await screen.findByText('江南春游')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('目标 ID / 年份'), '2026');
    await userEvent.click(screen.getByRole('button', { name: '创建胶囊' }));

    await waitFor(() => expect(createMemoryCapsule).toHaveBeenCalledWith({ type: 'trip', targetId: '2026' }));
    expect(onOpenCapsule).toHaveBeenCalledWith('capsule-2');
  });
});
