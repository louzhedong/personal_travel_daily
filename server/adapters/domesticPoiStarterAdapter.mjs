import { createCatalogEntry } from './types.mjs';

const DOMESTIC_POI_DOCUMENTS = [
  {
    id: 'domestic-poi-zhoushan-dongji',
    scope: 'domestic',
    title: '舟山玩法速览：东极岛两天一夜',
    summary: '适合第一次去舟山的海岛路线，覆盖庙子湖、东福山日出、海鲜排档与岛间交通节奏。',
    sourceName: '国内目的地 POI',
    sourceUrl: 'https://guide-api.local/domestic-poi/zhoushan-dongji',
    destinationLabel: '舟山',
    tags: ['海岛', '东极岛', '两日游'],
    blocks: [
      { id: 'poi-1', type: 'section-title', text: '适合人群' },
      { id: 'poi-2', type: 'paragraph', text: '适合第一次去舟山、想体验海岛节奏和看海上日出的旅行者。' },
      { id: 'poi-3', type: 'section-title', text: '推荐节奏' },
      { id: 'poi-4', type: 'bullet-list', text: '沈家门半升洞码头 - 庙子湖入住 - 环岛散步 - 东福山看日出 - 返程' },
      { id: 'poi-5', type: 'tips', text: '旺季船票要提前预订，岛上住宿集中在庙子湖，返程要预留天气变化弹性。' },
    ],
  },
  {
    id: 'domestic-poi-zhoushan-putuo',
    scope: 'domestic',
    title: '舟山玩法速览：普陀山朝圣与海景慢游',
    summary: '把普济寺、法雨寺、南海观音与百步沙串成一条轻松路线，兼顾礼佛和海边散步。',
    sourceName: '国内目的地 POI',
    sourceUrl: 'https://guide-api.local/domestic-poi/zhoushan-putuo',
    destinationLabel: '舟山',
    tags: ['普陀山', '寺院', '慢游'],
    blocks: [
      { id: 'poi-6', type: 'section-title', text: '推荐路线' },
      { id: 'poi-7', type: 'bullet-list', text: '朱家尖蜈蚣峙码头 - 普济寺 - 法雨寺 - 南海观音 - 百步沙' },
      { id: 'poi-8', type: 'paragraph', text: '如果更看重海景与轻松节奏，建议把傍晚时间留给百步沙和千步沙。' },
      { id: 'poi-9', type: 'tips', text: '景区内部交通以景交车为主，节假日排队时间明显增加。' },
    ],
  },
  {
    id: 'domestic-poi-zhoushan-zhujiajian',
    scope: 'domestic',
    title: '舟山玩法速览：朱家尖海滩与日落',
    summary: '更偏休闲海边度假，适合安排南沙、东沙、乌石塘和海鲜宵夜。',
    sourceName: '国内目的地 POI',
    sourceUrl: 'https://guide-api.local/domestic-poi/zhoushan-zhujiajian',
    destinationLabel: '舟山',
    tags: ['朱家尖', '海滩', '日落'],
    blocks: [
      { id: 'poi-10', type: 'section-title', text: '轻松玩法' },
      { id: 'poi-11', type: 'bullet-list', text: '南沙沙滩 - 乌石塘 - 东沙日落 - 大青山沿海公路' },
      { id: 'poi-12', type: 'paragraph', text: '朱家尖更适合自驾或包车慢慢走，看海、拍照、吃海鲜会比赶景点更舒服。' },
    ],
  },
  {
    id: 'domestic-poi-jiaxing-citywalk',
    scope: 'domestic',
    title: '嘉兴 city walk：南湖到月河的半日路线',
    summary: '适合周末轻旅行，把南湖红船、子城遗址和月河历史街区串在一条步行线里。',
    sourceName: '国内目的地 POI',
    sourceUrl: 'https://guide-api.local/domestic-poi/jiaxing-citywalk',
    destinationLabel: '嘉兴',
    tags: ['city walk', '南湖', '周末'],
    blocks: [
      { id: 'poi-13', type: 'section-title', text: '半日节奏' },
      { id: 'poi-14', type: 'bullet-list', text: '南湖景区 - 子城遗址公园 - 月河历史街区 - 粽子伴手礼' },
      { id: 'poi-15', type: 'tips', text: '嘉兴更适合放慢节奏体验城市气质，建议预留饭点尝试本地浇头面和粽子。' },
    ],
  },
  {
    id: 'domestic-poi-yangzhou-garden',
    scope: 'domestic',
    title: '扬州园林与早茶一日路线',
    summary: '围绕瘦西湖、个园、东关街和早茶店的经典扬州玩法，适合第一次去。',
    sourceName: '国内目的地 POI',
    sourceUrl: 'https://guide-api.local/domestic-poi/yangzhou-garden',
    destinationLabel: '扬州',
    tags: ['园林', '早茶', '一日游'],
    blocks: [
      { id: 'poi-16', type: 'section-title', text: '推荐节奏' },
      { id: 'poi-17', type: 'bullet-list', text: '早茶 - 瘦西湖 - 个园 - 东关街 - 夜游古运河' },
      { id: 'poi-18', type: 'tips', text: '旺季瘦西湖建议一早入园，中午后转去园林和老街体验更顺。' },
    ],
  },
];

const catalog = DOMESTIC_POI_DOCUMENTS.map((document) =>
  createCatalogEntry({
    ...document,
    adapterId: 'domestic-poi-starter',
    authorName: 'Voyage Atlas',
    publishedAt: '2026-04-18',
    searchableText: `${document.title} ${document.summary} ${document.destinationLabel} ${(document.tags ?? []).join(' ')} 国内 景点 玩法 POI zhoushan jiaxing yangzhou putuoshan dongji zhujiajian`,
  }),
);

export const domesticPoiStarterAdapter = {
  id: 'domestic-poi-starter',
  entries: [],
  async search({ keyword, scope = 'all', pageSize = 6 }) {
    const normalizedKeyword = `${keyword ?? ''}`.trim().toLowerCase();
    if (!normalizedKeyword || scope === 'international') {
      return [];
    }

    return catalog
      .filter((entry) => entry.scope === 'all' || scope === 'all' || entry.scope === scope)
      .filter((entry) =>
        `${entry.title} ${entry.summary} ${entry.destinationLabel} ${entry.searchableText}`.toLowerCase().includes(normalizedKeyword),
      )
      .slice(0, Math.min(8, pageSize));
  },
  async getDocument(sourceUrl) {
    const document = DOMESTIC_POI_DOCUMENTS.find((entry) => entry.sourceUrl === sourceUrl);
    if (!document) {
      return null;
    }

    return {
      ...document,
      authorName: 'Voyage Atlas',
      publishedAt: '2026-04-18',
      coverImageUrl: undefined,
      fetchedAt: new Date().toISOString(),
    };
  },
};
