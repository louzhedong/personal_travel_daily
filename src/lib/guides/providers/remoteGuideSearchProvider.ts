import type { GuideDocument, GuideSearchParams, GuideSearchResponse } from '../../../types';
import type { GuideContentProvider, GuideSearchProvider } from '../types';

function readApiConfig() {
  return {
    baseUrl: import.meta.env.VITE_GUIDE_SEARCH_API_BASE_URL?.trim() || '/api/guides',
    apiKey: import.meta.env.VITE_GUIDE_SEARCH_API_KEY?.trim(),
  };
}

function assertBaseUrl(baseUrl?: string) {
  if (!baseUrl) {
    throw new Error('未配置攻略搜索服务地址');
  }
  return baseUrl.replace(/\/$/, '');
}

function resolveCandidateBaseUrls(baseUrl: string) {
  const candidates: string[] = [];

  if (typeof window !== 'undefined' && baseUrl.startsWith('/')) {
    const { hostname, protocol } = window.location;
    const guideApiProtocol = protocol === 'https:' ? 'https:' : 'http:';

    if (hostname) {
      candidates.push(`${guideApiProtocol}//${hostname}:8787${baseUrl}`);
    }

    candidates.push(`http://127.0.0.1:8787${baseUrl}`);
    candidates.push(`http://localhost:8787${baseUrl}`);
  }

  candidates.push(baseUrl);

  return [...new Set(candidates)];
}

async function postGuideApi(path: '/search' | '/document', payload: unknown) {
  const { baseUrl, apiKey } = readApiConfig();
  const resolvedBaseUrl = assertBaseUrl(baseUrl);
  const candidateBaseUrls = resolveCandidateBaseUrls(resolvedBaseUrl);

  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (const candidateBaseUrl of candidateBaseUrls) {
    try {
      const response = await fetch(`${candidateBaseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status !== 404 || candidateBaseUrl === candidateBaseUrls[candidateBaseUrls.length - 1]) {
        return response;
      }

      lastResponse = response;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError instanceof Error ? lastError : new Error('攻略服务暂时不可用');
}

export const remoteGuideSearchProvider: GuideSearchProvider = {
  async search(params: GuideSearchParams): Promise<GuideSearchResponse> {
    const response = await postGuideApi('/search', params);

    if (!response.ok) {
      throw new Error(`攻略搜索失败 (${response.status})`);
    }

    return (await response.json()) as GuideSearchResponse;
  },
};

export const remoteGuideContentProvider: GuideContentProvider = {
  async getDocument(sourceUrl: string): Promise<GuideDocument | null> {
    const response = await postGuideApi('/document', { sourceUrl });

    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`攻略正文获取失败 (${response.status})`);
    }

    return (await response.json()) as GuideDocument;
  },
};
