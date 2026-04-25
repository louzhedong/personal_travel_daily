export function normalizeText(value) {
  return `${value ?? ''}`.trim().toLowerCase();
}

export function tokenizeKeyword(keyword) {
  return normalizeText(keyword)
    .split(/\s+/)
    .filter(Boolean);
}

export function buildGuideHaystack(guide) {
  return normalizeText(
    [
      guide.title,
      guide.summary,
      guide.destinationLabel ?? '',
      guide.authorName ?? '',
      guide.searchableText ?? '',
      ...(guide.tags ?? []),
      ...((guide.blocks ?? []).map((block) => block.text)),
    ].join(' '),
  );
}

export function scoreGuide(guide, tokens) {
  const haystack = buildGuideHaystack(guide);
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 1;
    }
    if (normalizeText(guide.title).includes(token)) {
      score += 2;
    }
    if (normalizeText(guide.destinationLabel ?? '').includes(token)) {
      score += 1;
    }
  }
  return score;
}

function toSearchResult(guide) {
  return {
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
  };
}

export function searchGuideDocuments(guides, params) {
  const keyword = `${params.keyword ?? ''}`.trim();
  if (!keyword) {
    return {
      items: [],
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 8,
      hasMore: false,
      provider: 'guide-api-local',
      fetchedAt: new Date().toISOString(),
    };
  }

  const tokens = tokenizeKeyword(keyword);
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(20, Math.max(1, Number(params.pageSize) || 8));
  const scope = params.scope ?? 'all';

  const ranked = guides
    .filter((guide) => scope === 'all' || guide.scope === 'all' || guide.scope === scope)
    .map((guide) => ({ guide, score: scoreGuide(guide, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      const leftPublishedAt = left.guide.publishedAt ?? '';
      const rightPublishedAt = right.guide.publishedAt ?? '';
      return right.score - left.score || rightPublishedAt.localeCompare(leftPublishedAt);
    });

  const start = (page - 1) * pageSize;
  const items = ranked.slice(start, start + pageSize).map((entry) => toSearchResult(entry.guide));

  return {
    items,
    page,
    pageSize,
    hasMore: start + pageSize < ranked.length,
    provider: 'guide-api-local',
    fetchedAt: new Date().toISOString(),
  };
}

export function findGuideDocumentBySourceUrl(guides, sourceUrl) {
  return guides.find((guide) => guide.sourceUrl === sourceUrl) ?? null;
}
