import { buildGuideDocumentFromHtml, fetchRemoteHtml } from './htmlGuideUtils.mjs';
import { createCatalogEntry } from './types.mjs';

const entries = [
  createCatalogEntry({
    id: 'kyoto-travel-cn-about',
    adapterId: 'kyoto-travel-cn',
    scope: 'international',
    title: '探寻京都 | 京都旅游',
    summary: '京都旅游中文官网的城市介绍页，适合快速了解京都的文化气质、区域特色与行前认知。',
    sourceName: '京都旅游',
    sourceUrl: 'https://kyoto.travel/cn/aboutkyoto.html',
    destinationLabel: '京都',
    tags: ['京都', '中文官网', '官方旅游'],
    searchableText: '京都 旅游 中文 官方 探寻京都 京都攻略 京都旅游',
  }),
  createCatalogEntry({
    id: 'kyoto-travel-cn-itineraries',
    adapterId: 'kyoto-travel-cn',
    scope: 'international',
    title: '推荐行程 | 京都旅游',
    summary: '京都旅游中文官网的推荐行程页，适合获取一日游和多日游路线灵感。',
    sourceName: '京都旅游',
    sourceUrl: 'https://kyoto.travel/cn/itineraries/',
    destinationLabel: '京都',
    tags: ['京都', '中文官网', '行程', '路线'],
    searchableText: '京都 行程 推荐 路线 中文 官方 京都旅游',
  }),
];

export const kyotoTravelCnAdapter = {
  id: 'kyoto-travel-cn',
  entries,
  async search({ keyword }) {
    const normalized = keyword.trim().toLowerCase();
    return entries.filter((entry) =>
      `${entry.title} ${entry.summary} ${entry.searchableText}`.toLowerCase().includes(normalized),
    );
  },
  async getDocument(sourceUrl) {
    const entry = entries.find((item) => item.sourceUrl === sourceUrl);
    if (!entry) {
      return null;
    }
    const html = await fetchRemoteHtml(entry.sourceUrl);
    return buildGuideDocumentFromHtml(entry, html);
  },
};
