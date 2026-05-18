import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchPhotoAlbums, updatePhotoAlbumPreferences } from '../../lib/api/photoAlbumsApi';
import { fetchPhotoCuration, updatePhotoCuration } from '../../lib/api/photoCurationApi';
import type { PhotoAlbumsResponseDto, PhotoCurationResponseDto } from '../../lib/api/types';
import PhotoCurationPage from '../photos/PhotoCurationPage';

vi.mock('../../lib/api/photoAlbumsApi', () => ({
  fetchPhotoAlbums: vi.fn(),
  updatePhotoAlbumPreferences: vi.fn(),
}));

vi.mock('../../lib/api/photoCurationApi', () => ({
  fetchPhotoCuration: vi.fn(),
  updatePhotoCuration: vi.fn(),
}));

vi.mock('../../components/ui/FancySelect', () => ({
  FancySelect: ({
    value,
    onChange,
    options,
    ariaLabel,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    ariaLabel?: string;
  }) => (
    <select aria-label={ariaLabel ?? '影像筛选'} value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

const account = {
  id: 'acct-1',
  name: 'Voyage Atlas',
  username: 'demo',
  role: 'admin' as const,
};

const baseResponse: PhotoCurationResponseDto = {
  summary: {
    totalPhotos: 2,
    featuredPhotos: 1,
    missingCaptionPhotos: 1,
    tripCount: 1,
    companionCount: 1,
    yearCount: 1,
  },
  filters: {
    trips: [{ id: 'trip-1', name: '杭州周末', photoCount: 2 }],
    companions: [{ id: 'user-alice', name: '小悠', color: '#2563eb', photoCount: 2 }],
    years: [{ year: 2026, photoCount: 2 }],
  },
  sections: {
    featured: [
      {
        imageId: 'image-1',
        imageUrl: 'https://example.com/hangzhou.jpg',
        markerId: 'marker-1',
        markerTitle: '浙江 · 杭州',
        tripId: 'trip-1',
        tripName: '杭州周末',
        companionId: 'user-alice',
        companionName: '小悠',
        companionColor: '#2563eb',
        scopeName: '浙江',
        city: '杭州',
        visitedStartAt: '2026-05-01T00:00:00.000Z',
        isFeatured: true,
        caption: '西湖晚风',
        curatedSortOrder: 0,
      },
    ],
    missingCaptions: [
      {
        imageId: 'image-2',
        imageUrl: 'https://example.com/suzhou.jpg',
        markerId: 'marker-2',
        markerTitle: '江苏 · 苏州',
        tripId: 'trip-1',
        tripName: '杭州周末',
        companionId: 'user-alice',
        companionName: '小悠',
        companionColor: '#2563eb',
        scopeName: '江苏',
        city: '苏州',
        visitedStartAt: '2026-05-02T00:00:00.000Z',
        isFeatured: false,
      },
    ],
    recent: [],
  },
  items: [],
};

const responseWithWorklist: PhotoCurationResponseDto = {
  ...baseResponse,
  items: [...baseResponse.sections.featured, ...baseResponse.sections.missingCaptions],
};

const albumResponse: PhotoAlbumsResponseDto = {
  summary: {
    albumCount: 1,
    coverCandidateCount: 2,
    pinnedCoverCount: 0,
    issueCount: 1,
  },
  albums: [
    {
      id: 'trip-cover-trip-1',
      kind: 'tripCover',
      targetKind: 'trip',
      targetId: 'trip-1',
      title: '杭州周末封面候选',
      subtitle: 'Story Studio、行程详情与胶囊共用的封面排序',
      metricLabel: '2 张照片',
      photoCount: 2,
      coverCandidates: [
        {
          ...baseResponse.sections.featured[0],
          score: 96,
          isPinned: false,
          issueKinds: [],
        },
        {
          ...baseResponse.sections.missingCaptions[0],
          score: 40,
          isPinned: false,
          issueKinds: ['missingCaption'],
        },
      ],
    },
  ],
  issues: [
    {
      kind: 'missingCaption',
      title: '缺少说明',
      description: '补充说明后可提升故事质量。',
      photos: [
        {
          ...baseResponse.sections.missingCaptions[0],
          score: 40,
          isPinned: false,
          issueKinds: ['missingCaption'],
        },
      ],
    },
  ],
  preferences: [],
};

describe('PhotoCurationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchPhotoCuration).mockResolvedValue(responseWithWorklist);
    vi.mocked(fetchPhotoAlbums).mockResolvedValue(albumResponse);
    vi.mocked(updatePhotoCuration).mockResolvedValue({
      ...responseWithWorklist,
      summary: {
        ...responseWithWorklist.summary,
        featuredPhotos: 2,
        missingCaptionPhotos: 0,
      },
    });
    vi.mocked(updatePhotoAlbumPreferences).mockResolvedValue({
      ...albumResponse,
      summary: {
        ...albumResponse.summary,
        pinnedCoverCount: 1,
      },
    });
  });

  it('renders summary, smart albums, filters, featured preview, and worklist', async () => {
    render(
      <PhotoCurationPage
        account={account}
        onLogout={vi.fn()}
        onNavigateBack={vi.fn()}
      />,
    );

    expect(await screen.findByRole('heading', { name: '影像策展台' })).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('全部照片').length).toBeGreaterThan(0);
    expect(screen.getAllByText('智能相册').length).toBeGreaterThan(0);
    expect(screen.getAllByText('杭州周末封面候选').length).toBeGreaterThan(0);
    expect(screen.getByText('缺少说明')).toBeInTheDocument();
    expect(screen.getByLabelText('选择行程')).toBeInTheDocument();
    expect(screen.getByText('精选预览')).toBeInTheDocument();
    expect(screen.getByText('待整理')).toBeInTheDocument();
    expect(screen.getByText('西湖晚风')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('补一句可以被故事复用的话')).toBeInTheDocument();
    expect(fetchPhotoCuration).toHaveBeenCalledWith({ featured: 'all', caption: 'all', limit: 120 });
    expect(fetchPhotoAlbums).toHaveBeenCalled();
  });

  it('refetches when filters change', async () => {
    const user = userEvent.setup();
    render(
      <PhotoCurationPage
        account={account}
        onLogout={vi.fn()}
        onNavigateBack={vi.fn()}
      />,
    );

    await screen.findByRole('heading', { name: '影像策展台' });
    await user.selectOptions(screen.getByLabelText('选择行程'), 'trip-1');

    await waitFor(() => {
      expect(fetchPhotoCuration).toHaveBeenLastCalledWith({
        tripId: 'trip-1',
        featured: 'all',
        caption: 'all',
        limit: 120,
      });
    });
  });

  it('updates featured state and shows global toast feedback', async () => {
    const user = userEvent.setup();
    render(
      <PhotoCurationPage
        account={account}
        onLogout={vi.fn()}
        onNavigateBack={vi.fn()}
      />,
    );

    await user.click(await screen.findByRole('button', { name: '设为精选' }));

    expect(updatePhotoCuration).toHaveBeenCalledWith(
      {
        items: [{ imageId: 'image-2', isFeatured: true }],
      },
      { featured: 'all', caption: 'all', limit: 120 },
    );
    expect(await screen.findByText('已设为精选照片')).toBeInTheDocument();
  });

  it('pins a smart album cover candidate and shows global toast feedback', async () => {
    const user = userEvent.setup();
    render(
      <PhotoCurationPage
        account={account}
        onLogout={vi.fn()}
        onNavigateBack={vi.fn()}
      />,
    );

    await user.click(await screen.findByRole('button', { name: /96 分/ }));

    expect(updatePhotoAlbumPreferences).toHaveBeenCalledWith({
      preferences: [
        {
          targetKind: 'trip',
          targetId: 'trip-1',
          pinnedImageIds: ['image-1'],
          sortOrder: ['image-1', 'image-2'],
        },
      ],
    });
    expect(await screen.findByText('已钉选封面候选')).toBeInTheDocument();
  });

  it('updates caption on blur and shows global toast feedback', async () => {
    const user = userEvent.setup();
    render(
      <PhotoCurationPage
        account={account}
        onLogout={vi.fn()}
        onNavigateBack={vi.fn()}
      />,
    );

    const captionInput = await screen.findByPlaceholderText('补一句可以被故事复用的话');
    await user.type(captionInput, '园林午后');
    fireEvent.blur(captionInput);

    await waitFor(() => {
      expect(updatePhotoCuration).toHaveBeenCalledWith(
        {
          items: [{ imageId: 'image-2', caption: '园林午后' }],
        },
        { featured: 'all', caption: 'all', limit: 120 },
      );
    });
    expect(await screen.findByText('已更新照片说明')).toBeInTheDocument();
  });

  it('shows error toast when update fails', async () => {
    vi.mocked(updatePhotoCuration).mockRejectedValueOnce(new Error('照片整理失败'));
    const user = userEvent.setup();
    render(
      <PhotoCurationPage
        account={account}
        onLogout={vi.fn()}
        onNavigateBack={vi.fn()}
      />,
    );

    await user.click(await screen.findByRole('button', { name: '设为精选' }));

    expect(await screen.findByText('照片整理失败')).toBeInTheDocument();
  });

  it('renders compact empty state', async () => {
    vi.mocked(fetchPhotoCuration).mockResolvedValueOnce({
      ...baseResponse,
      summary: {
        totalPhotos: 0,
        featuredPhotos: 0,
        missingCaptionPhotos: 0,
        tripCount: 0,
        companionCount: 0,
        yearCount: 0,
      },
      filters: { trips: [], companions: [], years: [] },
      sections: { featured: [], missingCaptions: [], recent: [] },
      items: [],
    });
    vi.mocked(fetchPhotoAlbums).mockResolvedValueOnce({
      summary: {
        albumCount: 0,
        coverCandidateCount: 0,
        pinnedCoverCount: 0,
        issueCount: 0,
      },
      albums: [],
      issues: [],
      preferences: [],
    });

    render(
      <PhotoCurationPage
        account={account}
        onLogout={vi.fn()}
        onNavigateBack={vi.fn()}
      />,
    );

    expect(await screen.findByText('暂无照片素材')).toBeInTheDocument();
    expect(screen.getByText('已整理完成')).toBeInTheDocument();
  });
});
