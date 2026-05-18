import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMarkerTagVocabulary,
  deleteMarkerTagVocabulary,
  fetchMarkerTagVocabulary,
  updateMarkerTagVocabulary,
} from '../../lib/api/tagVocabularyApi';
import type { MarkerTagVocabularyResponseDto } from '../../lib/api/types';
import TagGovernancePage from '../tag-governance/TagGovernancePage';

vi.mock('../../lib/api/tagVocabularyApi', () => ({
  fetchMarkerTagVocabulary: vi.fn(),
  createMarkerTagVocabulary: vi.fn(),
  updateMarkerTagVocabulary: vi.fn(),
  deleteMarkerTagVocabulary: vi.fn(),
}));

const account = {
  id: 'acct-1',
  name: 'Voyage Atlas',
  username: 'demo',
  role: 'admin' as const,
};

const vocabulary: MarkerTagVocabularyResponseDto = {
  items: [
    { value: 'food', label: '美食', source: 'system', isHidden: false, sortOrder: 0, usageCount: 2 },
    { id: 'tag-1', value: 'onsen', label: '温泉', source: 'custom', isHidden: false, sortOrder: 500, usageCount: 0 },
  ],
  visibleItems: [
    { value: 'food', label: '美食', source: 'system', isHidden: false, sortOrder: 0, usageCount: 2 },
    { id: 'tag-1', value: 'onsen', label: '温泉', source: 'custom', isHidden: false, sortOrder: 500, usageCount: 0 },
  ],
  systemCount: 10,
  customCount: 1,
};

describe('TagGovernancePage', () => {
  beforeEach(() => {
    vi.mocked(fetchMarkerTagVocabulary).mockReset();
    vi.mocked(createMarkerTagVocabulary).mockReset();
    vi.mocked(updateMarkerTagVocabulary).mockReset();
    vi.mocked(deleteMarkerTagVocabulary).mockReset();
    vi.mocked(fetchMarkerTagVocabulary).mockResolvedValue(vocabulary);
    vi.mocked(createMarkerTagVocabulary).mockResolvedValue(vocabulary);
    vi.mocked(updateMarkerTagVocabulary).mockResolvedValue(vocabulary);
    vi.mocked(deleteMarkerTagVocabulary).mockResolvedValue({ ...vocabulary, customCount: 0, items: vocabulary.items.slice(0, 1), visibleItems: vocabulary.visibleItems.slice(0, 1) });
  });

  it('renders vocabulary summary and creates a custom tag', async () => {
    render(<TagGovernancePage account={account} onLogout={vi.fn()} onNavigateBack={vi.fn()} />);

    expect(await screen.findByText('标签治理与自定义词表')).toBeInTheDocument();
    expect(screen.getByText('温泉')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('例如：温泉'), '咖啡');
    await userEvent.type(screen.getByPlaceholderText('例如：onsen，可留空自动生成'), 'coffee');
    await userEvent.click(screen.getByRole('button', { name: '新增标签' }));

    await waitFor(() => {
      expect(createMarkerTagVocabulary).toHaveBeenCalledWith({ label: '咖啡', value: 'coffee' });
    });
  });

  it('updates visibility and deletes unused custom tags', async () => {
    render(<TagGovernancePage account={account} onLogout={vi.fn()} onNavigateBack={vi.fn()} />);

    await screen.findByText('温泉');
    await userEvent.click(screen.getAllByRole('button', { name: '隐藏' })[0]);
    expect(updateMarkerTagVocabulary).toHaveBeenCalledWith('food', { isHidden: true });

    await userEvent.click(screen.getByRole('button', { name: '删除' }));
    expect(deleteMarkerTagVocabulary).toHaveBeenCalledWith('onsen');
  });
});
