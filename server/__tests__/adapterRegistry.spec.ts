import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listAdapterEntries, loadDocumentFromAdapters, searchEntriesFromAdapters } from '../adapters/index.mjs';

const wikivoyageSearchPayload = [
  '京都',
  ['京都'],
  ['京都的中文旅行指南'],
  ['https://zh.wikivoyage.org/wiki/%E4%BA%AC%E9%83%BD'],
];

const wikivoyageDocumentPayload = {
  parse: {
    text: `
      <div>
        <h2>到达</h2>
        <p>京都可以通过新干线和关西机场巴士到达。</p>
        <ul>
          <li>清水寺</li>
          <li>岚山</li>
        </ul>
      </div>
    `,
  },
};

const qyerForumListHtml = `
  <div class="thread-item">
    <a href="/thread-28976543-1.html">舟山 | 东极岛、东福山与海鲜排档的两天一夜</a>
    <div class="post-preview">适合第一次去舟山的海岛玩法，重点看日出、交通和住宿节奏。</div>
    <a class="author">海风旅行者</a>
    <span>2026-04-01</span>
  </div>
`;

const qyerThreadHtml = `
  <main>
    <h1>舟山 | 东极岛、东福山与海鲜排档的两天一夜</h1>
    <p>第一天下午从沈家门出发，入住庙子湖，晚上在码头附近吃海鲜。</p>
    <p>第二天一早去东福山看日出，回程前留出足够的船期缓冲。</p>
  </main>
`;

const geoapifyGeocodePayload = {
  results: [
    {
      lat: 29.9853,
      lon: 122.2072,
      city: '舟山市',
      result_type: 'city',
    },
  ],
};

const geoapifyPlacesPayload = {
  features: [
    {
      properties: {
        place_id: 'geoapify-poi-1',
        name: '普陀山风景名胜区',
        state: '浙江省',
        city: '舟山市',
        suburb: '普陀区',
        formatted: '浙江省舟山市普陀区普陀山',
        address_line1: '普陀山风景名胜区',
        address_line2: '舟山市普陀区',
        categories: ['tourism.attraction', 'religion.temple'],
      },
    },
  ],
};

const geoapifyPlaceDetailsPayload = {
  features: [
    {
      properties: {
        place_id: 'geoapify-poi-1',
        name: '普陀山风景名胜区',
        state: '浙江省',
        city: '舟山市',
        suburb: '普陀区',
        formatted: '浙江省舟山市普陀区普陀山',
        address_line1: '普陀山风景名胜区',
        address_line2: '舟山市普陀区',
        categories: ['tourism.attraction', 'religion.temple'],
        website: 'https://example.com/putuoshan',
        datasource: {
          sourcename: 'openstreetmap',
        },
      },
    },
  ],
};

describe('adapter registry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.GUIDE_POI_GEOAPIFY_API_KEY;
  });

  it('exposes Chinese-source catalog entries for search', () => {
    const entries = listAdapterEntries();

    expect(entries.some((entry) => entry.sourceName === '京都旅游')).toBe(true);
    expect(entries.some((entry) => entry.sourceName === '国内目的地 POI')).toBe(false);
  });

  it('searches zh.wikivoyage and returns Chinese guide entries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => wikivoyageSearchPayload,
      }),
    );

    const entries = await searchEntriesFromAdapters({
      keyword: '京都',
      scope: 'all',
      pageSize: 6,
    });

    expect(entries.some((entry) => entry.sourceName === '维基导游')).toBe(true);
    expect(entries.some((entry) => entry.destinationLabel === '京都')).toBe(true);
  });

  it('falls back to Chinese encyclopedia-style destination entries for broader places', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ['舟山', ['舟山市'], ['中国浙江省下辖地级市、群岛城市'], ['https://zh.wikipedia.org/wiki/%E8%88%9F%E5%B1%B1%E5%B8%82']],
      }),
    );

    const entries = await searchEntriesFromAdapters({
      keyword: '舟山',
      scope: 'domestic',
      pageSize: 6,
    });

    expect(entries.some((entry) => entry.sourceName === '维基百科')).toBe(true);
    expect(entries.some((entry) => entry.destinationLabel === '舟山市')).toBe(true);
  });

  it('fetches and cleans a Chinese remote document through the matching adapter', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => wikivoyageDocumentPayload,
      }),
    );

    const document = await loadDocumentFromAdapters(
      'https://zh.wikivoyage.org/wiki/%E4%BA%AC%E9%83%BD',
    );

    expect(document?.sourceName).toBe('维基导游');
    expect(document?.blocks.some((block) => block.text.includes('京都可以通过新干线'))).toBe(true);
  });

  it('searches qyer forum threads for domestic travel posts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => qyerForumListHtml,
      }),
    );

    const entries = await searchEntriesFromAdapters({
      keyword: '舟山',
      scope: 'domestic',
      pageSize: 6,
    });

    expect(entries.some((entry) => entry.sourceName === '穷游论坛')).toBe(true);
    expect(entries.some((entry) => entry.title.includes('舟山'))).toBe(true);
  });

  it('loads qyer forum thread content as a structured document', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => qyerThreadHtml,
      }),
    );

    const document = await loadDocumentFromAdapters('https://bbs.qyer.com/thread-28976543-1.html');

    expect(document?.sourceName).toBe('穷游论坛');
    expect(document?.blocks.some((block) => block.text.includes('沈家门'))).toBe(true);
  });

  it('returns fallback domestic poi entries when realtime poi key is not configured', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network not needed')));

    const entries = await searchEntriesFromAdapters({
      keyword: '舟山',
      scope: 'domestic',
      pageSize: 6,
    });

    expect(entries.some((entry) => entry.sourceName === '国内目的地 POI')).toBe(true);
    expect(entries.some((entry) => entry.title.includes('普陀山'))).toBe(true);
  });

  it('uses realtime geoapify poi search when a server key is configured', async () => {
    process.env.GUIDE_POI_GEOAPIFY_API_KEY = 'test-key';

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input) => {
        const url = `${input}`;

        if (url.includes('/v1/geocode/search')) {
          return {
            ok: true,
            json: async () => geoapifyGeocodePayload,
          };
        }

        if (url.includes('/v2/places')) {
          return {
            ok: true,
            json: async () => geoapifyPlacesPayload,
          };
        }

        throw new Error(`unexpected fetch: ${url}`);
      }),
    );

    const entries = await searchEntriesFromAdapters({
      keyword: '舟山',
      scope: 'domestic',
      pageSize: 6,
    });

    expect(entries.some((entry) => entry.sourceName === 'Geoapify POI')).toBe(true);
    expect(entries.some((entry) => entry.sourceUrl.includes('geoapify.com/place?id='))).toBe(true);
  });

  it('loads realtime geoapify poi details as structured document', async () => {
    process.env.GUIDE_POI_GEOAPIFY_API_KEY = 'test-key';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => geoapifyPlaceDetailsPayload,
      }),
    );

    const document = await loadDocumentFromAdapters(
      'https://www.geoapify.com/place?id=geoapify-poi-1',
    );

    expect(document?.sourceName).toBe('Geoapify POI');
    expect(document?.blocks.some((block) => block.text.includes('舟山市普陀区'))).toBe(true);
  });
});
