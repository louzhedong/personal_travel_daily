import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getGuideLlmConfig } from './config.mjs';
import { createLocalLlmClient } from './localLlmClient.mjs';
import { normalizeText, scoreGuide, tokenizeKeyword } from '../guideSearchEngine.mjs';

const INDEX_FILE_NAME = 'guide-embeddings.json';

function hashText(text) {
  return crypto.createHash('sha1').update(text).digest('hex');
}

function buildGuideEmbeddingText(guide) {
  return [
    guide.title,
    guide.summary,
    guide.destinationLabel ?? '',
    guide.authorName ?? '',
    ...(guide.tags ?? []),
    guide.searchableText ?? '',
    ...((guide.blocks ?? []).map((block) => block.text)),
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 6000);
}

function toSearchResult(guide, metadata) {
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
    matchReason: metadata.matchReason,
    semanticScore: Number(metadata.semanticScore.toFixed(4)),
    queryInterpretation: metadata.queryInterpretation,
  };
}

function cosineSimilarity(left, right) {
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  const length = Math.min(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

async function readIndex(config) {
  try {
    const raw = await fs.readFile(path.join(config.indexDir, INDEX_FILE_NAME), 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && parsed.records ? parsed.records : {};
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function writeIndex(config, records) {
  await fs.mkdir(config.indexDir, { recursive: true });
  await fs.writeFile(
    path.join(config.indexDir, INDEX_FILE_NAME),
    JSON.stringify({ updatedAt: new Date().toISOString(), records }, null, 2),
    'utf-8',
  );
}

function isFresh(record, config, now) {
  if (!record?.embedding || !Array.isArray(record.embedding)) {
    return false;
  }
  if (!record.cachedAt) {
    return false;
  }
  const cachedAt = Date.parse(record.cachedAt);
  if (!Number.isFinite(cachedAt)) {
    return false;
  }
  return now - cachedAt < config.indexTtlHours * 60 * 60 * 1000;
}

async function getGuideEmbedding({ guide, client, config, records, now }) {
  const text = buildGuideEmbeddingText(guide);
  const textHash = hashText(`${config.embedModel}\n${text}`);
  const key = guide.sourceUrl || guide.id;
  const cached = records[key];

  if (cached?.textHash === textHash && isFresh(cached, config, now)) {
    return cached.embedding;
  }

  const embedding = await client.embed(text);
  records[key] = {
    textHash,
    model: config.embedModel,
    cachedAt: new Date(now).toISOString(),
    embedding,
  };
  return embedding;
}

function normalizeStringList(value) {
  return Array.isArray(value)
    ? value.map((item) => `${item ?? ''}`.trim()).filter(Boolean).slice(0, 8)
    : [];
}

function includesNormalized(haystack, needle) {
  if (!needle) {
    return false;
  }

  return normalizeText(haystack).includes(normalizeText(needle));
}

function uniqueList(items) {
  const seen = new Set();
  const nextItems = [];

  for (const item of items) {
    const normalized = normalizeText(item);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    nextItems.push(item.trim());
  }

  return nextItems;
}

function detectSeason(keyword) {
  const candidates = ['春季', '夏季', '秋季', '冬季', '春天', '夏天', '秋天', '冬天', '樱花季', '赏樱', '红叶', '避暑'];
  return candidates.find((item) => includesNormalized(keyword, item)) ?? '';
}

function detectActivities(keyword) {
  const candidates = ['赏樱', '徒步', '慢游', '自由行', '亲子', '带老人', '美食', '拍照', '古城', '海岛', '温泉'];
  return candidates.filter((item) => includesNormalized(keyword, item));
}

function resolveDestinationFromKeyword(keyword, guides) {
  const destinationCandidates = uniqueList(
    guides
      .flatMap((guide) => [guide.destinationLabel, guide.scopeName, guide.city])
      .filter(Boolean),
  );

  const matched = destinationCandidates
    .filter((item) => includesNormalized(keyword, item))
    .sort((left, right) => right.length - left.length);

  if (matched.length > 0) {
    return matched[0];
  }

  const tokens = `${keyword}`.trim().split(/\s+/).filter(Boolean);
  return tokens[0] ?? '';
}

function sanitizeInterpretation(keyword, guides, result) {
  const fallbackDestination = resolveDestinationFromKeyword(keyword, guides);
  const llmDestination = `${result.destination ?? ''}`.trim();
  const destination = includesNormalized(keyword, llmDestination) ? llmDestination : fallbackDestination;
  const season = includesNormalized(keyword, `${result.season ?? ''}`.trim())
    ? `${result.season ?? ''}`.trim()
    : detectSeason(keyword);
  const preferences = uniqueList(
    normalizeStringList(result.preferences).filter((item) => includesNormalized(keyword, item)),
  );
  const activities = uniqueList([
    ...detectActivities(keyword),
    ...normalizeStringList(result.activities).filter((item) => includesNormalized(keyword, item)),
  ]);
  const synonyms = uniqueList(
    normalizeStringList(result.synonyms).filter((item) => includesNormalized(keyword, item)),
  );
  const llmSummary = `${result.summary ?? ''}`.trim();
  const summaryParts = [destination, season, ...preferences, ...activities].filter(Boolean);

  return {
    destination,
    season,
    preferences,
    activities,
    synonyms,
    summary: summaryParts.length > 0 ? summaryParts.join(' ') : includesNormalized(keyword, llmSummary) ? llmSummary : keyword,
  };
}

async function interpretQuery(keyword, guides, client) {
  const result = await client.chatJson([
    {
      role: 'system',
      content:
        '你是旅游攻略搜索查询理解器。只能提取用户原始查询中明确出现的信息，不能改写成别的城市、别的季节或原查询中没有的主题。只返回 JSON，不要解释。字段：destination:string, preferences:string[], season:string, activities:string[], synonyms:string[], summary:string。',
    },
    {
      role: 'user',
      content: `请把这个旅游攻略搜索词提取成结构化检索意图，只能使用原词中明确出现的信息：${keyword}`,
    },
  ]);

  return sanitizeInterpretation(keyword, guides, result);
}

function buildQueryEmbeddingText(keyword, interpretation) {
  return [
    keyword,
    interpretation.destination,
    interpretation.season,
    ...(interpretation.preferences ?? []),
    ...(interpretation.activities ?? []),
    ...(interpretation.synonyms ?? []),
    interpretation.summary,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildMatchReason(guide, interpretation, keywordScore) {
  const parts = [];

  if (interpretation.destination && includesNormalized(guide.destinationLabel ?? guide.title, interpretation.destination)) {
    parts.push(`目的地匹配“${interpretation.destination}”`);
  }
  if (interpretation.activities?.length) {
    parts.push(`玩法相关：${interpretation.activities.slice(0, 2).join('、')}`);
  }
  if (!parts.length && keywordScore > 0) {
    parts.push('关键词命中标题或摘要');
  }

  return parts[0] ?? '语义相似度较高';
}

export async function searchGuideDocumentsSemantically(guides, params, dependencies = {}) {
  const config = dependencies.config ?? getGuideLlmConfig();
  const requestedMode = params.searchMode ?? config.defaultSearchMode;
  if (!config.enabled || requestedMode === 'keyword') {
    return null;
  }

  const keyword = `${params.keyword ?? ''}`.trim();
  if (!keyword) {
    return null;
  }

  const client = dependencies.client ?? createLocalLlmClient(config);
  const now = dependencies.now ?? Date.now();
  const tokens = tokenizeKeyword(keyword);
  const scope = params.scope ?? 'all';
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(20, Math.max(1, Number(params.pageSize) || 8));

  const interpretation = await interpretQuery(keyword, guides, client);
  const queryEmbedding = await client.embed(buildQueryEmbeddingText(keyword, interpretation));
  const records = await readIndex(config);
  let indexChanged = false;

  const ranked = [];
  for (const guide of guides) {
    if (!(scope === 'all' || guide.scope === 'all' || guide.scope === scope)) {
      continue;
    }

    const before = records[guide.sourceUrl || guide.id];
    const guideEmbedding = await getGuideEmbedding({ guide, client, config, records, now });
    const after = records[guide.sourceUrl || guide.id];
    indexChanged = indexChanged || before !== after;

    const semanticScore = cosineSimilarity(queryEmbedding, guideEmbedding);
    const keywordScore = scoreGuide(guide, tokens);
    const publishedBoost = guide.publishedAt ? Date.parse(guide.publishedAt) || 0 : 0;
    const score = semanticScore + keywordScore * 0.08 + publishedBoost / 10_000_000_000_000;

    if (semanticScore > 0.2 || keywordScore > 0) {
      ranked.push({
        guide,
        score,
        semanticScore,
        keywordScore,
      });
    }
  }

  if (indexChanged) {
    await writeIndex(config, records);
  }

  ranked.sort((left, right) => right.score - left.score);

  const start = (page - 1) * pageSize;
  const queryInterpretation = interpretation.summary || keyword;
  const items = ranked.slice(start, start + pageSize).map((entry) =>
    toSearchResult(entry.guide, {
      semanticScore: entry.semanticScore,
      queryInterpretation,
      matchReason: buildMatchReason(entry.guide, interpretation, entry.keywordScore),
    }),
  );

  return {
    items,
    page,
    pageSize,
    hasMore: start + pageSize < ranked.length,
    provider: 'guide-api-local-llm',
    fetchedAt: new Date(now).toISOString(),
  };
}

export const guideSemanticSearchInternals = {
  buildGuideEmbeddingText,
  buildQueryEmbeddingText,
  cosineSimilarity,
  sanitizeInterpretation,
  resolveDestinationFromKeyword,
};
