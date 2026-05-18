import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

function readBlobAsText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsText(blob);
  });
}

describe('MemoryCapsuleDetailPage', () => {
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  const originalClick = HTMLAnchorElement.prototype.click;
  const account = { id: 'acct-1', name: 'Voyage Atlas', username: 'demo', role: 'member' as const };

  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:capsule-detail-archive');
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    HTMLAnchorElement.prototype.click = originalClick;
  });

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

  it('exposes a local archive package export action', async () => {
    vi.mocked(fetchMemoryCapsule).mockResolvedValue({ capsule: detail });

    render(
      <MemoryCapsuleDetailPage
        account={account}
        capsuleId="capsule-1"
        onLogout={vi.fn()}
        onNavigateBack={vi.fn()}
      />,
    );

    await userEvent.click(await screen.findByRole('button', { name: '导出本地归档包' }));

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    const exportedBlob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    const archiveText = await readBlobAsText(exportedBlob);
    expect(archiveText).toContain('manifest.json');
    expect(archiveText).toContain('content/capsule.json');
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
  });

  it('opens a map replay story for the capsule source', async () => {
    const onOpenMapReplayStory = vi.fn();
    vi.mocked(fetchMemoryCapsule).mockResolvedValue({ capsule: detail });

    render(
      <MemoryCapsuleDetailPage
        account={account}
        capsuleId="capsule-1"
        onLogout={vi.fn()}
        onNavigateBack={vi.fn()}
        onOpenMapReplayStory={onOpenMapReplayStory}
      />,
    );

    await userEvent.click(await screen.findByRole('button', { name: '打开地图回放故事' }));

    expect(onOpenMapReplayStory).toHaveBeenCalledWith('trip', 'trip-1');
  });
});
