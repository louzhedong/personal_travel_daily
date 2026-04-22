import type {
  GuideDocument,
  GuideSearchParams,
  GuideSearchResponse,
} from '../../../types';
import type { GuideContentProvider, GuideSearchProvider } from '../types';

const MOCK_GUIDES: GuideDocument[] = [
  {
    id: 'guide-kyoto-spring',
    title: 'Kyoto Spring Cherry Blossom Guide',
    summary: 'A relaxed 3-day route covering Kiyomizu-dera, the Philosopher\'s Path, and Arashiyama.',
    coverImageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
    sourceName: 'Mock Travel',
    sourceUrl: 'https://mock.example.com/guides/kyoto-spring',
    authorName: 'Voyage Editor',
    publishedAt: '2026-03-01',
    destinationLabel: 'Kyoto',
    tags: ['sakura', 'spring', '3-day'],
    contentHtml: `
      <h3>Best Season</h3>
      <p>Late March to early April is usually the peak cherry blossom window, so book hotels at least 3 to 4 weeks ahead.</p>
      <h3>Suggested Rhythm</h3>
      <p>Three days works well for first-time visitors who want enough time for Higashiyama, a quieter morning walk and one west-side neighborhood.</p>
      <h3>Recommended Route</h3>
      <ul>
        <li>Kiyomizu-dera and Ninenzaka</li>
        <li>Philosopher&#39;s Path and Maruyama Park</li>
        <li>Arashiyama before the tour buses arrive</li>
      </ul>
      <h3>Stay Advice</h3>
      <p>Shijo Kawaramachi balances food options, bus access and an easy evening walk back to the hotel.</p>
    `.trim(),
    fetchedAt: '2026-04-17T00:00:00.000Z',
    blocks: [
      { id: 'b1', type: 'section-title', text: 'Best Season' },
      {
        id: 'b2',
        type: 'paragraph',
        text: 'Late March to early April is usually the peak cherry blossom window, so book hotels at least 3 to 4 weeks ahead.',
      },
      { id: 'b3', type: 'section-title', text: 'Suggested Route' },
      { id: 'b4', type: 'bullet-list', text: 'Kiyomizu-dera - Ninenzaka - Philosopher\'s Path - Maruyama Park - Arashiyama' },
    ],
  },
  {
    id: 'guide-yunnan-roadtrip',
    title: 'Yunnan Road Trip: Dali, Lijiang, and Shangri-La in 6 Days',
    summary: 'A classic Yunnan line covering Dali Old Town, Erhai Lake, Jade Dragon Snow Mountain, and Dukezong.',
    coverImageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
    sourceName: 'Mock Travel',
    sourceUrl: 'https://mock.example.com/guides/yunnan-roadtrip',
    authorName: 'Voyage Editor',
    publishedAt: '2026-02-18',
    destinationLabel: 'Yunnan',
    tags: ['roadtrip', 'plateau', '6-day'],
    fetchedAt: '2026-04-17T00:00:00.000Z',
    blocks: [
      { id: 'c1', type: 'section-title', text: 'Route Overview' },
      {
        id: 'c2',
        type: 'paragraph',
        text: 'Go in through Dali and out through Shangri-La so the altitude climbs gradually and helps reduce altitude sickness risk.',
      },
      {
        id: 'c3',
        type: 'tips',
        text: 'Shangri-La has a big day-night temperature swing, so bring a light down jacket from April to October.',
      },
    ],
  },
];

function normalizeKeyword(keyword: string) {
  return keyword.trim().toLowerCase();
}

export const mockGuideSearchProvider: GuideSearchProvider = {
  async search(params: GuideSearchParams): Promise<GuideSearchResponse> {
    const keyword = normalizeKeyword(params.keyword);
    const items = MOCK_GUIDES.filter((guide) => {
      const haystack = `${guide.title} ${guide.summary} ${guide.destinationLabel ?? ''} ${(guide.tags ?? []).join(' ')}`.toLowerCase();
      return haystack.includes(keyword);
    }).map((guide) => ({
      id: guide.id,
      title: guide.title,
      summary: guide.summary,
      coverImageUrl: guide.coverImageUrl,
      sourceName: guide.sourceName,
      sourceUrl: guide.sourceUrl,
      authorName: guide.authorName,
      publishedAt: guide.publishedAt,
      destinationLabel: guide.destinationLabel,
      tags: guide.tags,
    }));

    return {
      items,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
      hasMore: false,
      provider: 'mock',
      fetchedAt: new Date().toISOString(),
    };
  },
};

export const mockGuideContentProvider: GuideContentProvider = {
  async getDocument(sourceUrl: string) {
    return MOCK_GUIDES.find((guide) => guide.sourceUrl === sourceUrl) ?? null;
  },
};
