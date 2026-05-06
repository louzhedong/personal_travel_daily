import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchTripDetail } from '../../lib/api/tripsApi';
import TripStoryPage from '../trips/TripStoryPage';

vi.mock('../../lib/api/tripsApi', () => ({
  fetchTripDetail: vi.fn(),
}));

function readBlobAsText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsText(blob);
  });
}

describe('TripStoryPage', () => {
  const originalPrint = window.print;
  const originalTitle = document.title;
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  const originalClick = HTMLAnchorElement.prototype.click;
  const account = {
    id: 'acct-1',
    name: 'Voyage Atlas',
    username: 'demo',
    role: 'member' as const,
  };

  const tripDetailResponse = {
    trip: {
      id: 'trip-1',
      name: '江南春游',
      note: '一次慢下来看的江南周末。',
      startsAt: '2026-05-01',
      endsAt: '2026-05-03',
      createdAt: '2026-04-20T00:00:00.000Z',
      coverImageUrl: undefined,
    },
    summary: {
      markerCount: 2,
      travelDays: 3,
      cityCount: 2,
      regionCount: 2,
      companionCount: 1,
      guideCount: 1,
      photoCount: 1,
    },
    companions: [{ id: 'user-alice', name: '小悠', color: '#2563eb', markerCount: 2 }],
    markers: [
      {
        id: 'marker-1',
        companionId: 'user-alice',
        companionName: '小悠',
        companionColor: '#2563eb',
        scope: 'domestic',
        scopeId: 'zj',
        scopeName: '浙江',
        city: '杭州',
        note: '西湖晚风很好。',
        imageUrls: ['https://example.com/hangzhou.jpg'],
        tags: ['food'],
        weather: 'sunny',
        transport: 'walk',
        budgetLevel: 'medium',
        visitedStartAt: '2026-05-01',
        visitedEndAt: '2026-05-01',
      },
      {
        id: 'marker-2',
        companionId: 'user-alice',
        companionName: '小悠',
        companionColor: '#2563eb',
        scope: 'domestic',
        scopeId: 'js',
        scopeName: '江苏',
        city: '苏州',
        note: '园林里走了很久。',
        imageUrls: [],
        visitedStartAt: '2026-05-02',
        visitedEndAt: '2026-05-02',
      },
    ],
    photos: [
      {
        imageId: 'image-1',
        markerId: 'marker-1',
        markerTitle: '浙江 · 杭州',
        imageUrl: 'https://example.com/hangzhou.jpg',
        visitedStartAt: '2026-05-01',
        scopeName: '浙江',
        city: '杭州',
        isFeatured: true,
        caption: '西湖晚风',
        curatedSortOrder: 0,
      },
    ],
    guides: [
      {
        id: 'guide-1',
        markerId: 'marker-1',
        keyword: '杭州周末',
        savedAt: '2026-05-05T00:00:00.000Z',
        result: {
          id: 'guide-doc-1',
          title: '杭州周末攻略',
          summary: '西湖和灵隐寺路线建议。',
          sourceName: 'Qyer',
          sourceUrl: 'https://example.com/guide',
        },
      },
    ],
    checklistSummary: {
      total: 2,
      preDepartureCount: 0,
      inTransitCount: 0,
      doneCount: 2,
    },
    checklistGroups: [
      {
        stage: 'done',
        title: '已经完成',
        description: '完成事项。',
        itemCount: 2,
        items: [
          {
            id: 'item-1',
            companionId: 'user-alice',
            companionName: '小悠',
            companionColor: '#2563eb',
            title: '确认酒店',
            stage: 'done',
            sortOrder: 0,
            origin: 'manual',
            createdAt: '2026-04-20T00:00:00.000Z',
            updatedAt: '2026-04-20T00:00:00.000Z',
          },
        ],
      },
    ],
    meta: {
      generatedAt: '2026-05-06T12:30:00.000Z',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.print = vi.fn();
    URL.createObjectURL = vi.fn(() => 'blob:story');
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
    document.title = originalTitle;
    vi.mocked(fetchTripDetail).mockResolvedValue(tripDetailResponse as never);
  });

  afterEach(() => {
    window.print = originalPrint;
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    HTMLAnchorElement.prototype.click = originalClick;
    document.title = originalTitle;
  });

  it('renders the story page after loading', async () => {
    render(
      <TripStoryPage
        account={account}
        tripId="trip-1"
        onNavigateBack={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(await screen.findByRole('heading', { name: '江南春游' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '这次旅行的故事骨架' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '故事徽章' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '精选瞬间' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '路线回放海报' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '时间线叙事' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '照片段落' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '攻略摘录' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '行前清单回顾' })).toBeInTheDocument();
    expect(screen.getByText('西湖晚风很好。')).toBeInTheDocument();
    expect(screen.getAllByText('西湖晚风').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('多城串联')).toBeInTheDocument();
    expect(screen.getByText(/2 站路线回放/)).toBeInTheDocument();
    expect(screen.getByText('杭州周末攻略')).toBeInTheDocument();
    expect(screen.getAllByText('2 / 2 项已完成，完成度 100%').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/从 浙江 · 杭州 到 江苏 · 苏州/)).toBeInTheDocument();
  });

  it('prints the story page and uses the trip name as the document title', async () => {
    const user = userEvent.setup();

    render(
      <TripStoryPage
        account={account}
        tripId="trip-1"
        onNavigateBack={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(await screen.findByRole('heading', { name: '江南春游' })).toBeInTheDocument();
    expect(document.title).toBe('江南春游 · 旅行故事');

    await user.click(screen.getByRole('button', { name: '导出 PDF / 打印' }));

    expect(window.print).toHaveBeenCalledOnce();
  });

  it('switches story templates and exports a long image', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchTripDetail).mockResolvedValueOnce({
      ...tripDetailResponse,
      summary: {
        ...tripDetailResponse.summary,
        photoCount: 18,
      },
      photos: Array.from({ length: 18 }, (_, index) => ({
        imageId: `image-${index + 1}`,
        markerId: 'marker-1',
        markerTitle: `浙江 · 杭州 ${index + 1}`,
        imageUrl: `https://example.com/hangzhou-${index + 1}.jpg`,
        visitedStartAt: '2026-05-01',
        scopeName: '浙江',
        city: '杭州',
        isFeatured: index < 2,
        caption: index === 0 ? '第一张精选' : undefined,
        curatedSortOrder: index,
      })),
    } as never);

    render(
      <TripStoryPage
        account={account}
        tripId="trip-1"
        onNavigateBack={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(await screen.findByRole('heading', { name: '江南春游' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '明信片' }));
    expect(screen.getByRole('main')).toHaveClass('trip-story-template-postcard');
    await user.click(screen.getByRole('button', { name: '纪念册' }));
    expect(screen.getByRole('main')).toHaveClass('trip-story-template-memoir');

    await user.click(screen.getByRole('button', { name: '导出长图' }));

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    const exportedBlob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    const exportedSvg = await readBlobAsText(exportedBlob);
    expect(exportedSvg).toContain('精选瞬间');
    expect(exportedSvg).toContain('故事徽章');
    expect(exportedSvg).toContain('路线回放海报');
    expect(exportedSvg).toContain('第一张精选');
    expect(exportedSvg).toContain('照片段落');
    expect(exportedSvg).toContain('PHOTO 18');
    expect(exportedSvg).toContain('<image href="https://example.com/hangzhou-18.jpg"');
    expect(Number(exportedSvg.match(/height="(\d+)"/)?.[1])).toBeGreaterThan(1800);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:story');
  });

  it('exports square and vertical story share cards', async () => {
    const user = userEvent.setup();

    render(
      <TripStoryPage
        account={account}
        tripId="trip-1"
        onNavigateBack={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(await screen.findByRole('heading', { name: '江南春游' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '导出方形分享卡' }));
    await user.click(screen.getByRole('button', { name: '导出竖版分享卡' }));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    const squareSvg = await readBlobAsText(vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob);
    const verticalSvg = await readBlobAsText(vi.mocked(URL.createObjectURL).mock.calls[1][0] as Blob);

    expect(squareSvg).toContain('width="1080" height="1080"');
    expect(squareSvg).toContain('江南春游');
    expect(squareSvg).toContain('旅行天数');
    expect(squareSvg).toContain('<image href="https://example.com/hangzhou.jpg"');
    expect(verticalSvg).toContain('width="1080" height="1920"');
    expect(verticalSvg).toContain('私有旅行故事分享卡');
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(2);
  });

  it('shows empty states when optional story materials are missing', async () => {
    vi.mocked(fetchTripDetail).mockResolvedValueOnce({
      ...tripDetailResponse,
      summary: {
        ...tripDetailResponse.summary,
        markerCount: 0,
        photoCount: 0,
        guideCount: 0,
      },
      markers: [],
      photos: [],
      guides: [],
      checklistSummary: {
        total: 0,
        preDepartureCount: 0,
        inTransitCount: 0,
        doneCount: 0,
      },
      checklistGroups: [],
    } as never);

    render(
      <TripStoryPage account={account} tripId="trip-1" onNavigateBack={vi.fn()} onLogout={vi.fn()} />,
    );

    expect(await screen.findByText('还没有可展示的路线停靠点。')).toBeInTheDocument();
    expect(screen.getByText('这次行程还没有旅行记录。')).toBeInTheDocument();
    expect(screen.getByText('这次旅行还没有照片，后续补图后故事页会自动展示。')).toBeInTheDocument();
    expect(screen.getByText('这次行程还没有关联攻略。')).toBeInTheDocument();
    expect(screen.getByText('这次行程还没有清单事项。')).toBeInTheDocument();
  });

  it('handles not found errors and navigation actions', async () => {
    const user = userEvent.setup();
    const onNavigateBack = vi.fn();
    const onLogout = vi.fn();
    vi.mocked(fetchTripDetail).mockRejectedValueOnce(new Error('trip not found'));

    render(
      <TripStoryPage
        account={account}
        tripId="missing-trip"
        onNavigateBack={onNavigateBack}
        onLogout={onLogout}
      />,
    );

    expect(await screen.findByText('行程不存在或无权访问')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '导出 PDF / 打印' })).not.toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: '返回行程详情' })[0]);
    await user.click(screen.getByRole('button', { name: '退出登录' }));

    expect(onNavigateBack).toHaveBeenCalledOnce();
    expect(onLogout).toHaveBeenCalledOnce();
  });
});
