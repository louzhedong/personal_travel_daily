import path from 'node:path';

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_INDEX_TTL_HOURS = 168;

function readBoolean(value, fallback = false) {
  if (value == null || value === '') {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(`${value}`.trim().toLowerCase());
}

function readPositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getGuideLlmConfig() {
  const cacheRoot = process.env.GUIDE_CACHE_DIR
    ? path.resolve(process.env.GUIDE_CACHE_DIR)
    : path.resolve(process.cwd(), 'server', 'cache');

  return {
    enabled: readBoolean(process.env.GUIDE_LLM_ENABLED, false),
    baseUrl: (process.env.GUIDE_LLM_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, ''),
    chatModel: process.env.GUIDE_LLM_CHAT_MODEL || 'qwen2.5:3b',
    embedModel: process.env.GUIDE_LLM_EMBED_MODEL || 'embeddinggemma',
    timeoutMs: readPositiveNumber(process.env.GUIDE_LLM_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    defaultSearchMode: process.env.GUIDE_LLM_SEARCH_MODE === 'keyword' ? 'keyword' : 'smart',
    indexTtlHours: readPositiveNumber(process.env.GUIDE_LLM_INDEX_TTL_HOURS, DEFAULT_INDEX_TTL_HOURS),
    indexDir: path.join(cacheRoot, 'llm-index'),
  };
}
