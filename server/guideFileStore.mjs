import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const cacheRoot = process.env.GUIDE_CACHE_DIR
  ? path.resolve(process.env.GUIDE_CACHE_DIR)
  : path.resolve(process.cwd(), 'server', 'cache');
const documentsDir = path.join(cacheRoot, 'documents');
const indexPath = path.join(cacheRoot, 'index.json');

function createCacheId(sourceUrl) {
  return crypto.createHash('sha1').update(sourceUrl).digest('hex');
}

async function ensureCacheRoot() {
  await fs.mkdir(documentsDir, { recursive: true });
}

async function readIndex() {
  await ensureCacheRoot();
  try {
    const raw = await fs.readFile(indexPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.documents) ? parsed.documents : [];
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeIndex(documents) {
  await ensureCacheRoot();
  await fs.writeFile(
    indexPath,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        documents,
      },
      null,
      2,
    ),
    'utf-8',
  );
}

function toIndexEntry(document, fileName) {
  return {
    id: document.id,
    scope: document.scope ?? 'all',
    title: document.title,
    summary: document.summary,
    coverImageUrl: document.coverImageUrl,
    sourceName: document.sourceName,
    sourceUrl: document.sourceUrl,
    authorName: document.authorName,
    publishedAt: document.publishedAt,
    destinationLabel: document.destinationLabel,
    tags: document.tags ?? [],
    searchableText: [
      document.title,
      document.summary,
      document.destinationLabel ?? '',
      ...(document.tags ?? []),
      ...document.blocks.map((block) => block.text),
    ].join(' '),
    fileName,
    cachedAt: new Date().toISOString(),
  };
}

export async function loadCachedGuideCatalog() {
  return readIndex();
}

export async function loadCachedGuideDocument(sourceUrl) {
  const documents = await readIndex();
  const matched = documents.find((entry) => entry.sourceUrl === sourceUrl);
  if (!matched?.fileName) {
    return null;
  }

  try {
    const raw = await fs.readFile(path.join(documentsDir, matched.fileName), 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function saveCachedGuideDocument(document) {
  await ensureCacheRoot();
  const fileName = `${createCacheId(document.sourceUrl)}.json`;
  await fs.writeFile(path.join(documentsDir, fileName), JSON.stringify(document, null, 2), 'utf-8');

  const existingEntries = await readIndex();
  const nextEntry = toIndexEntry(document, fileName);
  const filtered = existingEntries.filter((entry) => entry.sourceUrl !== document.sourceUrl);
  filtered.unshift(nextEntry);
  await writeIndex(filtered);
  return nextEntry;
}
