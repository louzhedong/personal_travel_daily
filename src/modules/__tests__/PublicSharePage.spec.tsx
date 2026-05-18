import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { accessPublicShareLink } from '../../lib/api/shareLinksApi';
import PublicSharePage from '../share/PublicSharePage';

vi.mock('../../lib/api/shareLinksApi', () => ({
  accessPublicShareLink: vi.fn(),
}));

describe('PublicSharePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a read-only shared memory capsule', async () => {
    vi.mocked(accessPublicShareLink).mockResolvedValue({
      resource: {
        kind: 'memory_capsule',
        title: '京都胶囊',
        generatedAt: '2026-05-12T00:00:00.000Z',
        memoryCapsule: {
          capsule: {
            id: 'capsule-1',
            type: 'trip',
            targetId: 'trip-1',
            targetLabel: '京都',
            title: '京都胶囊',
            template: 'editorial',
            status: 'ready',
            createdAt: '2026-05-12T00:00:00.000Z',
            updatedAt: '2026-05-12T00:00:00.000Z',
          },
          config: { exportPreset: 'balanced', sections: [], photos: [], badges: [] },
          content: {
            hero: { eyebrow: 'Capsule', title: '京都胶囊', subtitle: '春日记忆' },
            metrics: [{ label: '城市', value: '3', description: '东京 / 京都 / 奈良' }],
            badges: [],
            sections: [],
            route: [],
            timeline: [],
            photos: [{ imageId: 'image-1', imageUrl: 'https://example.com/a.jpg', title: '鸭川' }],
            guides: [],
            checklist: [],
            achievements: [],
            sourceLinks: [],
            emptyStates: [],
          },
        },
      },
    });

    render(<PublicSharePage token="raw-share-token-123" />);

    expect(await screen.findByRole('heading', { name: '京都胶囊' })).toBeInTheDocument();
    expect(screen.getByText('春日记忆')).toBeInTheDocument();
    expect(screen.getByText('隐私边界')).toBeInTheDocument();
    expect(accessPublicShareLink).toHaveBeenCalledWith('raw-share-token-123', undefined);
  });

  it('prompts for password before opening protected links', async () => {
    vi.mocked(accessPublicShareLink)
      .mockResolvedValueOnce({
        passwordRequired: true,
        link: {
          id: 'share-1',
          resourceType: 'memory_capsule',
          resourceId: 'capsule-1',
          title: '受保护胶囊',
          accessCount: 0,
          createdAt: '2026-05-12T00:00:00.000Z',
        },
      })
      .mockResolvedValueOnce({
        resource: {
          kind: 'memory_capsule',
          title: '受保护胶囊',
          generatedAt: '2026-05-12T00:00:00.000Z',
          memoryCapsule: {
            capsule: {
              id: 'capsule-1',
              type: 'trip',
              targetId: 'trip-1',
              targetLabel: '京都',
              title: '受保护胶囊',
              template: 'editorial',
              status: 'ready',
              createdAt: '2026-05-12T00:00:00.000Z',
              updatedAt: '2026-05-12T00:00:00.000Z',
            },
            config: { exportPreset: 'balanced', sections: [], photos: [], badges: [] },
            content: {
              hero: { eyebrow: 'Capsule', title: '受保护胶囊' },
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
        },
      });
    const user = userEvent.setup();

    render(<PublicSharePage token="protected-share-token" />);

    expect(await screen.findByRole('heading', { name: '受保护胶囊' })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('访问密码'), 'secret');
    await user.click(screen.getByRole('button', { name: '打开分享' }));

    expect(await screen.findByText('隐私边界')).toBeInTheDocument();
    expect(accessPublicShareLink).toHaveBeenLastCalledWith('protected-share-token', 'secret');
  });
});
