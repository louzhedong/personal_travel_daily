import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fetchMemoryCapsule, updateMemoryCapsule } from '../../lib/api/memoryCapsulesApi';
import MemoryCapsuleDetailPage from '../capsules/MemoryCapsuleDetailPage';

vi.mock('../../lib/api/memoryCapsulesApi', () => ({
  fetchMemoryCapsule: vi.fn(),
  updateMemoryCapsule: vi.fn(),
}));

const detail = {
  capsule: {
    id: 'capsule-1',
    type: 'trip' as const,
    targetId: 'trip-1',
    targetLabel: '江南春游',
    title: '江南春游',
    template: 'editorial' as const,
    status: 'draft' as const,
    createdAt: '2026-05-11T00:00:00.000Z',
    updatedAt: '2026-05-11T00:00:00.000Z',
  },
  config: {
    exportPreset: 'balanced' as const,
    sections: [{ id: 'brief', enabled: true, sortOrder: 0 }],
    photos: [],
    badges: [],
  },
  content: {
    hero: { eyebrow: 'Trip Capsule', title: '江南春游', subtitle: '慢游江南' },
    metrics: [{ label: '旅行天数', value: '3', description: '三天' }],
    badges: [],
    sections: [{ id: 'brief', eyebrow: 'Brief', title: '序言', body: '西湖晚风很好。', enabled: true, sortOrder: 0 }],
    route: [],
    timeline: [],
    photos: [],
    guides: [],
    checklist: [],
    achievements: [],
    sourceLinks: [],
    emptyStates: [],
  },
};

describe('MemoryCapsuleDetailPage', () => {
  const account = { id: 'acct-1', name: 'Voyage Atlas', username: 'demo', role: 'member' as const };

  it('renders capsule detail and saves edited title', async () => {
    vi.mocked(fetchMemoryCapsule).mockResolvedValue({ capsule: detail });
    vi.mocked(updateMemoryCapsule).mockResolvedValue({ capsule: { ...detail, capsule: { ...detail.capsule, title: '新的胶囊' } } });

    render(
      <MemoryCapsuleDetailPage
        account={account}
        capsuleId="capsule-1"
        onLogout={vi.fn()}
        onNavigateBack={vi.fn()}
      />,
    );

    const input = await screen.findByDisplayValue('江南春游');
    await userEvent.clear(input);
    await userEvent.type(input, '新的胶囊');
    await userEvent.click(screen.getByRole('button', { name: '保存胶囊' }));

    await waitFor(() => expect(updateMemoryCapsule).toHaveBeenCalledWith('capsule-1', expect.objectContaining({ title: '新的胶囊' })));
  });
});
