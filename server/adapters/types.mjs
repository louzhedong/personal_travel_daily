export function createCatalogEntry(entry) {
  return {
    id: entry.id,
    scope: entry.scope ?? 'all',
    title: entry.title,
    summary: entry.summary,
    coverImageUrl: entry.coverImageUrl,
    sourceName: entry.sourceName,
    sourceUrl: entry.sourceUrl,
    authorName: entry.authorName,
    publishedAt: entry.publishedAt,
    destinationLabel: entry.destinationLabel,
    tags: entry.tags ?? [],
    searchableText: entry.searchableText ?? '',
    adapterId: entry.adapterId,
  };
}
