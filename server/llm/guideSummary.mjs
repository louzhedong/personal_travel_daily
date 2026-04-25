import { getGuideLlmConfig } from './config.mjs';
import { createLocalLlmClient } from './localLlmClient.mjs';

const EMPTY_SUMMARY = {
  highlights: [],
  routeTips: [],
  transportTips: [],
  warnings: [],
};

function normalizeList(value) {
  return Array.isArray(value)
    ? value.map((item) => `${item ?? ''}`.trim()).filter(Boolean).slice(0, 6)
    : [];
}

function normalizeSummary(value) {
  return {
    highlights: normalizeList(value?.highlights),
    routeTips: normalizeList(value?.routeTips),
    transportTips: normalizeList(value?.transportTips),
    warnings: normalizeList(value?.warnings),
  };
}

function buildDocumentText(document) {
  return [
    document.title,
    document.summary,
    document.destinationLabel ?? '',
    ...(document.tags ?? []),
    ...(document.blocks ?? []).map((block) => block.text),
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 8000);
}

export async function enrichGuideDocumentWithAiSummary(document, dependencies = {}) {
  const config = dependencies.config ?? getGuideLlmConfig();
  if (!config.enabled || document.aiSummary) {
    return document;
  }

  const client = dependencies.client ?? createLocalLlmClient(config);
  try {
    const result = await client.chatJson([
      {
        role: 'system',
        content:
          '你是旅游攻略整理助手。只基于用户提供的攻略内容提炼，不要编造。只返回 JSON，字段：highlights:string[], routeTips:string[], transportTips:string[], warnings:string[]。',
      },
      {
        role: 'user',
        content: `请把下面攻略整理成速览：\n${buildDocumentText(document)}`,
      },
    ]);

    return {
      ...document,
      aiSummary: normalizeSummary(result),
    };
  } catch {
    return {
      ...document,
      aiSummary: EMPTY_SUMMARY,
    };
  }
}

export const guideSummaryInternals = {
  buildDocumentText,
  normalizeSummary,
};
