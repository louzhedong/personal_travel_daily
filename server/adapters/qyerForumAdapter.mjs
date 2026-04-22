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

function buildThreadId(sourceUrl) {
  return `qyer-forum-${encodeURIComponent(sourceUrl)}`;
}

export function isQyerVerificationPage(html) {
  return (
    typeof html === 'string' &&
    (html.includes('验证过程仅需几秒钟') ||
      html.includes('/st_res/web/check') ||
      html.includes('window.__INITIAL_STATE__={"userInfo"'))
  );
}

export function buildQyerFallbackDocument(entry) {
  const contentHtml = `
    <h3>帖子摘要</h3>
    <p>${entry.summary}</p>
    <h3>当前状态</h3>
    <p>穷游论坛当前对该帖子启用了访问验证，暂时无法稳定抓取完整正文。你仍然可以先参考帖子标题、摘要和发布时间，再跳转原网站继续阅读。</p>
    <h3>建议操作</h3>
    <ul>
      <li>先根据摘要判断内容方向是否匹配你的目的地和玩法</li>
      <li>点击下方原网站链接，在浏览器中查看完整帖子</li>
      <li>如果只是想快速收藏或关联，这个摘要版已经可以继续使用</li>
    </ul>
  `.trim();

  return {
    id: entry.id,
    title: entry.title,
    summary: entry.summary,
    sourceName: entry.sourceName,
    sourceUrl: entry.sourceUrl,
    authorName: entry.authorName,
    publishedAt: entry.publishedAt,
    destinationLabel: entry.destinationLabel,
    tags: entry.tags,
    contentHtml,
    blocks: [
      { id: 'qyer-fallback-1', type: 'section-title', text: '帖子摘要' },
      { id: 'qyer-fallback-2', type: 'paragraph', text: entry.summary },
      { id: 'qyer-fallback-3', type: 'tips', text: '该帖子当前触发了站点验证，建议点击原网站继续阅读完整正文。' },
    ],
    fetchedAt: new Date().toISOString(),
  };
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

    const forumPages = await Promise.all(QYER_FORUM_PAGES.map((url) => fetchRemoteHtml(url).catch(() => '')));
    const thread = forumPages
      .flatMap((html) => (html ? parseForumThreads(html) : []))
      .find((item) => item.sourceUrl === sourceUrl);
    const entry = buildEntry(
      thread ?? {
        sourceUrl,
        title: '穷游论坛攻略',
        summary: '来自穷游论坛的国内旅行经验整理',
      },
    );

    const html = await fetchRemoteHtml(sourceUrl);
    if (isQyerVerificationPage(html)) {
      return buildQyerFallbackDocument(entry);
    }

    return buildGuideDocumentFromHtml(
      createCatalogEntry({
        ...entry,
        id: buildThreadId(sourceUrl),
        adapterId: 'qyer-forum',
      }),
      html,
    );
  },
};
