import { getAppApiEnv } from '../env.js';
import type { GuideDocumentDto } from '../types.js';

function isGuideContentBlockArray(value: unknown): value is GuideDocumentDto['blocks'] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        !!item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.type === 'string' &&
        typeof item.text === 'string',
    )
  );
}

function isGuideAiSummary(value: unknown): value is NonNullable<GuideDocumentDto['aiSummary']> {
  return (
    !!value &&
    typeof value === 'object' &&
    Array.isArray((value as { highlights?: unknown[] }).highlights) &&
    Array.isArray((value as { routeTips?: unknown[] }).routeTips) &&
    Array.isArray((value as { transportTips?: unknown[] }).transportTips) &&
    Array.isArray((value as { warnings?: unknown[] }).warnings)
  );
}

function isGuideDocumentPayload(value: unknown): value is GuideDocumentDto {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as { id?: unknown }).id === 'string' &&
    typeof (value as { title?: unknown }).title === 'string' &&
    typeof (value as { summary?: unknown }).summary === 'string' &&
    typeof (value as { sourceName?: unknown }).sourceName === 'string' &&
    typeof (value as { sourceUrl?: unknown }).sourceUrl === 'string' &&
    typeof (value as { fetchedAt?: unknown }).fetchedAt === 'string' &&
    isGuideContentBlockArray((value as { blocks?: unknown }).blocks) &&
    (((value as { aiSummary?: unknown }).aiSummary === undefined ||
      isGuideAiSummary((value as { aiSummary?: unknown }).aiSummary)))
  );
}

export async function getGuideDocumentBySourceUrl(sourceUrl: string): Promise<GuideDocumentDto | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${getAppApiEnv().GUIDE_API_BASE_URL}/api/guides/document`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ sourceUrl }),
      signal: controller.signal,
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as unknown;
    if (!isGuideDocumentPayload(payload)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
