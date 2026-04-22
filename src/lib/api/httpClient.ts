import type { AppApiErrorPayload } from './types';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: object;
}

interface AppApiConfig {
  bootstrapBaseUrl: string;
  resourceBaseUrl: string;
}

function assertBaseUrl(baseUrl?: string) {
  if (!baseUrl) {
    throw new Error('未配置主业务 API 地址');
  }

  return baseUrl.replace(/\/$/, '');
}

function readAppApiConfig(): AppApiConfig {
  const configuredBaseUrl = assertBaseUrl(import.meta.env.VITE_APP_API_BASE_URL?.trim() || '/api/app');
  const resourceBaseUrl = configuredBaseUrl.endsWith('/app')
    ? configuredBaseUrl.slice(0, -'/app'.length)
    : configuredBaseUrl;

  return {
    bootstrapBaseUrl: configuredBaseUrl,
    resourceBaseUrl,
  };
}

function resolveCandidateBaseUrls(baseUrl: string) {
  const candidates: string[] = [];

  if (typeof window !== 'undefined' && baseUrl.startsWith('/')) {
    const { hostname, protocol } = window.location;
    const appApiProtocol = protocol === 'https:' ? 'https:' : 'http:';

    if (hostname) {
      candidates.push(`${appApiProtocol}//${hostname}:8788${baseUrl}`);
    }

    candidates.push(`http://127.0.0.1:8788${baseUrl}`);
    candidates.push(`http://localhost:8788${baseUrl}`);
  }

  candidates.push(baseUrl);

  return [...new Set(candidates)];
}

function buildUrl(baseUrl: string, path: string, query?: object) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');

  if (query) {
    Object.entries(query as Record<string, unknown>).forEach(([key, value]) => {
      if (
        value !== undefined &&
        (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
      ) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

async function parseErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as AppApiErrorPayload;
    return payload.error?.message || `主业务 API 请求失败 (${response.status})`;
  } catch {
    return `主业务 API 请求失败 (${response.status})`;
  }
}

async function requestJson<T>(baseUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
  const candidateBaseUrls = resolveCandidateBaseUrls(baseUrl);
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (const candidateBaseUrl of candidateBaseUrls) {
    try {
      const response = await fetch(buildUrl(candidateBaseUrl, path, options.query), {
        method: options.method ?? 'GET',
        credentials: 'include',
        headers:
          options.body !== undefined
            ? {
                'Content-Type': 'application/json',
              }
            : undefined,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });

      if (response.ok) {
        if (response.status === 204) {
          return undefined as T;
        }
        return (await response.json()) as T;
      }

      if (response.status !== 404 || candidateBaseUrl === candidateBaseUrls[candidateBaseUrls.length - 1]) {
        throw new Error(await parseErrorMessage(response));
      }

      lastResponse = response;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastResponse) {
    throw new Error(await parseErrorMessage(lastResponse));
  }

  throw lastError instanceof Error ? lastError : new Error('主业务 API 暂时不可用');
}

export function getBootstrapBaseUrl() {
  return readAppApiConfig().bootstrapBaseUrl;
}

export function getResourceBaseUrl() {
  return readAppApiConfig().resourceBaseUrl;
}

export const httpClient = {
  get<T>(baseUrl: string, path: string, query?: RequestOptions['query']) {
    return requestJson<T>(baseUrl, path, { method: 'GET', query });
  },
  post<T>(baseUrl: string, path: string, body?: unknown) {
    return requestJson<T>(baseUrl, path, { method: 'POST', body });
  },
  patch<T>(baseUrl: string, path: string, body?: unknown) {
    return requestJson<T>(baseUrl, path, { method: 'PATCH', body });
  },
  delete<T>(baseUrl: string, path: string) {
    return requestJson<T>(baseUrl, path, { method: 'DELETE' });
  },
};
