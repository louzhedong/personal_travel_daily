const FETCH_TIMEOUT_MS = 8000;
const REMOTE_DOCUMENT_TTL_MS = 30 * 60 * 1000;
const htmlCache = new Map();

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function stripTags(value) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function pickMeta(html, matchers) {
  for (const matcher of matchers) {
    const match = html.match(matcher);
    if (match) {
      return decodeHtmlEntities(match[1]).trim();
    }
  }
  return '';
}

function extractTitle(html) {
  return pickMeta(html, [/<title[^>]*>([\s\S]*?)<\/title>/i]);
}

function extractDescription(html) {
  return (
    pickMeta(html, [
      /<meta[^>]+property=["']og:description["'][^>]+content="([^"]*?)"[^>]*>/i,
      /<meta[^>]+property=["']og:description["'][^>]+content='([^']*?)'[^>]*>/i,
      /<meta[^>]+name=["']description["'][^>]+content="([^"]*?)"[^>]*>/i,
      /<meta[^>]+name=["']description["'][^>]+content='([^']*?)'[^>]*>/i,
    ])
  );
}

function extractImage(html) {
  return (
    pickMeta(html, [
      /<meta[^>]+property=["']og:image["'][^>]+content="([^"]*?)"[^>]*>/i,
      /<meta[^>]+property=["']og:image["'][^>]+content='([^']*?)'[^>]*>/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content="([^"]*?)"[^>]*>/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content='([^']*?)'[^>]*>/i,
    ])
  );
}

function isLikelyHeading(line) {
  if (line.length < 4 || line.length > 42) {
    return false;
  }
  if (/[:：]$/.test(line)) {
    return true;
  }
  return !/[。！？.!?]/.test(line) && !line.startsWith('- ');
}

function normalizeLine(line) {
  return line.replace(/\s+/g, ' ').trim();
}

function extractContentLines(html) {
  const candidate =
    html.match(/<main[\s\S]*?<\/main>/i)?.[0] ||
    html.match(/<article[\s\S]*?<\/article>/i)?.[0] ||
    html.match(/<body[\s\S]*?<\/body>/i)?.[0] ||
    html;

  const normalized = candidate
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/(p|div|section|article|main|h1|h2|h3|h4|h5|h6|br)>/gi, '\n');

  const lines = normalized
    .split('\n')
    .map((line) => stripTags(line))
    .map(normalizeLine)
    .filter(Boolean)
    .filter((line) => line.length >= 8)
    .filter((line) => !/^cookie/i.test(line))
    .filter((line) => !/^menu$/i.test(line))
    .filter((line) => !/^share$/i.test(line))
    .filter((line) => !/^follow us$/i.test(line));

  const deduped = [];
  for (const line of lines) {
    if (deduped[deduped.length - 1] !== line) {
      deduped.push(line);
    }
  }
  return deduped;
}

function buildBlocksFromLines(lines, fallbackSummary) {
  const blocks = [];
  let bulletBuffer = [];

  const flushBullets = () => {
    if (!bulletBuffer.length) {
      return;
    }
    blocks.push({
      id: `block-${blocks.length + 1}`,
      type: 'bullet-list',
      text: bulletBuffer.join(' | '),
    });
    bulletBuffer = [];
  };

  for (const line of lines) {
    if (blocks.length >= 8) {
      break;
    }
    if (line === fallbackSummary) {
      continue;
    }
    if (line.startsWith('- ')) {
      bulletBuffer.push(line.slice(2));
      continue;
    }

    flushBullets();
    blocks.push({
      id: `block-${blocks.length + 1}`,
      type: isLikelyHeading(line) ? 'section-title' : 'paragraph',
      text: line,
    });
  }

  flushBullets();
  return blocks;
}

export async function fetchRemoteHtml(url) {
  const cached = htmlCache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.html;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VoyageAtlasGuideBot/0.1 (+https://example.local/guide-api)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`remote fetch failed (${response.status})`);
    }

    const html = await response.text();
    htmlCache.set(url, {
      html,
      expiresAt: Date.now() + REMOTE_DOCUMENT_TTL_MS,
    });
    return html;
  } finally {
    clearTimeout(timeout);
  }
}

export function buildGuideDocumentFromHtml(entry, html) {
  const title = extractTitle(html) || entry.title;
  const summary = extractDescription(html) || entry.summary;
  const coverImageUrl = extractImage(html) || entry.coverImageUrl;
  const lines = extractContentLines(html)
    .filter((line) => line !== title)
    .filter((line) => line !== summary);

  const blocks = buildBlocksFromLines(lines, summary);
  if (!blocks.length && summary) {
    blocks.push({
      id: 'block-1',
      type: 'paragraph',
      text: summary,
    });
  }

  return {
    id: entry.id,
    title,
    summary,
    coverImageUrl,
    sourceName: entry.sourceName,
    sourceUrl: entry.sourceUrl,
    authorName: entry.authorName,
    publishedAt: entry.publishedAt,
    destinationLabel: entry.destinationLabel,
    tags: entry.tags,
    blocks,
    fetchedAt: new Date().toISOString(),
  };
}
