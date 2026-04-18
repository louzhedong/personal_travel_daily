import { buildGuideDocumentFromHtml } from './htmlGuideUtils.mjs';
import { createCatalogEntry } from './types.mjs';

const API_BASE = 'https://zh.wikivoyage.org/w/api.php';
const WIKI_BASE = 'https://zh.wikivoyage.org/wiki/';

function buildPageUrl(title) {
  return `${WIKI_BASE}${encodeURIComponent(title)}`;
}

function buildEntry(title, description = '') {
  return createCatalogEntry({
    id: `zh-wikivoyage-${encodeURIComponent(title)}`,
    adapterId: 'zh-wikivoyage',
    scope: 'all',
    title: `${title} | 维基导游`,
    summary: description || `${title} 的中文旅行指南`,
    sourceName: '维基导游',
    sourceUrl: buildPageUrl(title),
    destinationLabel: title,
    tags: ['中文攻略', '维基导游'],
    searchableText: `${title} 旅行 攻略 维基导游 中文`,
  });
}

async function readJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'VoyageAtlasGuideBot/0.1 (+https://example.local/guide-api)',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`remote fetch failed (${response.status})`);
  }

  return response.json();
}

function extractTitleFromSourceUrl(sourceUrl) {
  const url = new URL(sourceUrl);
  if (!url.hostname.includes('wikivoyage.org')) {
    return null;
  }
  const title = decodeURIComponent(url.pathname.replace(/^\/wiki\//, '')).trim();
  return title || null;
}

export const zhWikivoyageAdapter = {
  id: 'zh-wikivoyage',
  entries: [],
  async search({ keyword, pageSize = 6 }) {
    const url = new URL(API_BASE);
    url.searchParams.set('action', 'opensearch');
    url.searchParams.set('search', keyword);
    url.searchParams.set('limit', String(Math.min(8, pageSize)));
    url.searchParams.set('namespace', '0');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');

    const payload = await readJson(url);
    const titles = Array.isArray(payload?.[1]) ? payload[1] : [];
    const descriptions = Array.isArray(payload?.[2]) ? payload[2] : [];
    return titles.map((title, index) => buildEntry(title, descriptions[index] ?? ''));
  },
  async getDocument(sourceUrl) {
    const title = extractTitleFromSourceUrl(sourceUrl);
    if (!title) {
      return null;
    }

    const url = new URL(API_BASE);
    url.searchParams.set('action', 'parse');
    url.searchParams.set('page', title);
    url.searchParams.set('prop', 'text');
    url.searchParams.set('format', 'json');
    url.searchParams.set('formatversion', '2');
    url.searchParams.set('origin', '*');

    const payload = await readJson(url);
    const html = payload?.parse?.text;
    if (!html) {
      return null;
    }

    return buildGuideDocumentFromHtml(buildEntry(title), `<main>${html}</main>`);
  },
};
