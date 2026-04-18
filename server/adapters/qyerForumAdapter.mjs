import { buildGuideDocumentFromHtml, fetchRemoteHtml } from './htmlGuideUtils.mjs';
import { createCatalogEntry } from './types.mjs';

const QYER_FORUM_PAGES = [
  'https://bbs.qyer.com/forum-51-1.html',
  'https://bbs.qyer.com/forum-51-2.html',
  'https://bbs.qyer.com/forum-51-3.html',
  'https://bbs.qyer.com/forum-51-4.html',
];

function normalizeText(value) {
  return `${value ?? ''}`.replace(/\s+/g, ' ').trim();
}

function stripTags(value) {
  return normalizeText(
    `${value ?? ''}`
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>'),
  );
}

function scoreKeywordMatch(keyword, text) {
  const normalizedKeyword = normalizeText(keyword).toLowerCase();
  const normalizedText = normalizeText(text).toLowerCase();

  if (!normalizedKeyword || !normalizedText) {
    return 0;
  }
  if (normalizedText.includes(normalizedKeyword)) {
    return normalizedKeyword.length + 10;
  }

  return normalizedKeyword
    .split(/\s+/)
    .filter(Boolean)
    .reduce((score, token) => score + (normalizedText.includes(token) ? token.length : 0), 0);
}

function buildSourceUrl(url) {
  if (!url) {
    return '';
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://bbs.qyer.com${url.startsWith('/') ? '' : '/'}${url}`;
}

function buildEntry(thread) {
  const destinationLabel = thread.destinationLabel || thread.title.split('|')[0].trim();

  return createCatalogEntry({
    id: `qyer-forum-${encodeURIComponent(thread.sourceUrl)}`,
    adapterId: 'qyer-forum',
    scope: 'domestic',
    title: thread.title,
    summary: thread.summary,
    sourceName: '穷游论坛',
    sourceUrl: thread.sourceUrl,
    authorName: thread.authorName,
    publishedAt: thread.publishedAt,
    destinationLabel,
    tags: ['中文攻略', '游记帖子', '穷游论坛'],
    searchableText: `${thread.title} ${thread.summary} ${destinationLabel} 国内 旅行 攻略 游记 穷游论坛`,
  });
}

function parseForumThreads(html) {
  const threads = [];
  const threadPattern =
    /<a[^>]+href="(?<href>[^"]*thread-[^"]+)"[^>]*>(?<title>[\s\S]*?)<\/a>[\s\S]{0,1200}?(?:<div[^>]*class="[^"]*(?:post-preview|thread-preview|bbs-thread-preview)[^"]*"[^>]*>(?<preview>[\s\S]*?)<\/div>|<blockquote[^>]*>(?<blockquote>[\s\S]*?)<\/blockquote>)?[\s\S]{0,400}?(?:<a[^>]+class="[^"]*(?:author|user|avatar)[^"]*"[^>]*>(?<author>[\s\S]*?)<\/a>)?[\s\S]{0,250}?(?<date>20\d{2}-\d{2}-\d{2})?/gi;

  for (const match of html.matchAll(threadPattern)) {
    const sourceUrl = buildSourceUrl(match.groups?.href);
    const title = stripTags(match.groups?.title);
    const summary = stripTags(match.groups?.preview || match.groups?.blockquote).slice(0, 140);
    const authorName = stripTags(match.groups?.author);
    const publishedAt = normalizeText(match.groups?.date);

    if (!sourceUrl || !title) {
      continue;
    }

    threads.push({
      sourceUrl,
      title,
      summary: summary || `${title} 的国内旅行经验与攻略整理`,
      authorName: authorName || undefined,
      publishedAt: publishedAt || undefined,
      destinationLabel: title.split('|')[0].replace(/[〖〗【】]/g, '').trim(),
    });
  }

  const seen = new Set();
  return threads.filter((thread) => {
    if (seen.has(thread.sourceUrl)) {
      return false;
    }
    seen.add(thread.sourceUrl);
    return true;
  });
}

export const qyerForumAdapter = {
  id: 'qyer-forum',
  entries: [],
  async search({ keyword, scope = 'all', pageSize = 6 }) {
    if (scope === 'international') {
      return [];
    }

    const pages = await Promise.all(QYER_FORUM_PAGES.map((url) => fetchRemoteHtml(url).catch(() => '')));
    const threads = pages.flatMap((html) => (html ? parseForumThreads(html) : []));

    const ranked = threads
      .map((thread) => ({
        thread,
        score: scoreKeywordMatch(keyword, `${thread.title} ${thread.summary} ${thread.destinationLabel}`),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score);

    return ranked.slice(0, Math.min(8, pageSize)).map((entry) => buildEntry(entry.thread));
  },
  async getDocument(sourceUrl) {
    if (!sourceUrl.includes('bbs.qyer.com/thread-')) {
      return null;
    }

    const html = await fetchRemoteHtml(sourceUrl);
    return buildGuideDocumentFromHtml(
      createCatalogEntry({
        id: `qyer-forum-${encodeURIComponent(sourceUrl)}`,
        adapterId: 'qyer-forum',
        scope: 'domestic',
        title: '穷游论坛攻略',
        summary: '来自穷游论坛的国内旅行经验整理',
        sourceName: '穷游论坛',
        sourceUrl,
        tags: ['中文攻略', '游记帖子', '穷游论坛'],
      }),
      html,
    );
  },
};
