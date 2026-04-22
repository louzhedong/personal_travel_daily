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

const KYOTO_NOISE_PATTERNS = [
  /^宣传视频$/,
  /^查看所有视频$/,
  /^相关网站$/,
  /^探索隐秘瑰宝$/,
  /^携手共同守护京都$/,
  /^保护京都网站$/,
  /^像当地人一样旅行$/,
  /^展开内容$/,
  /^京北地区\s*\|?$/,
  /^高雄地区\s*\|?$/,
  /^西京地区\s*\|?$/,
  /^山科地区\s*\|?$/,
];

function stripTags(value) {
  return `${value ?? ''}`.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function isKyotoNoiseText(text) {
  const normalized = `${text ?? ''}`.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return true;
  }
  return KYOTO_NOISE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function shouldKeepKyotoBlock(block, blocks, index) {
  if (isKyotoNoiseText(block.text)) {
    return false;
  }

  if (block.type === 'section-title') {
    const nextMeaningfulBlock = blocks.slice(index + 1).find((item) => !isKyotoNoiseText(item.text));
    if (!nextMeaningfulBlock) {
      return false;
    }
    if (nextMeaningfulBlock.type === 'section-title') {
      return false;
    }
  }

  return true;
}

function buildHtmlFromBlocks(blocks) {
  return blocks
    .map((block) => {
      if (block.type === 'section-title') {
        return `<h3>${block.text}</h3>`;
      }
      if (block.type === 'bullet-list') {
        const items = block.text
          .split('|')
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => `<li>${item}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }
      return `<p>${block.text}</p>`;
    })
    .join('\n');
}

function refineKyotoDocument(document) {
  const filteredBlocks = document.blocks.filter((block, index, blocks) =>
    shouldKeepKyotoBlock(block, blocks, index),
  );

  return {
    ...document,
    blocks: filteredBlocks,
    contentHtml: buildHtmlFromBlocks(filteredBlocks),
  };
}

export function extractKyotoTravelContentHtml(html) {
  if (!html) {
    return html;
  }

  const contentStart = html.indexOf('<div id="content">');
  const footerStart = html.indexOf('<footer');
  if (contentStart === -1) {
    return html;
  }

  const focusedHtml = html.slice(contentStart, footerStart > contentStart ? footerStart : undefined);
  return focusedHtml
    .replace(/<div[^>]+id="itinerary-modal"[\s\S]*?<\/div>\s*<\/div>/gi, ' ')
    .replace(/<div[^>]+id="cookie-banner"[\s\S]*?<\/div>/gi, ' ')
    .replace(/<nav[^>]+aria-label="面包屑"[\s\S]*?<\/nav>/gi, ' ');
}

export function buildKyotoTravelDocument(entry, html) {
  const focusedHtml = extractKyotoTravelContentHtml(html);
  return refineKyotoDocument(buildGuideDocumentFromHtml(entry, focusedHtml || html));
}

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
    return buildKyotoTravelDocument(entry, html);
  },
};
