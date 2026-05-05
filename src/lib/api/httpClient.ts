import type { AppApiErrorPayload } from './types';
import { APP_API_ERROR_CODE } from './types';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: object;
}

interface AppApiConfig {
  bootstrapBaseUrl: string;
  resourceBaseUrl: string;
}

class HttpResponseError extends Error {}

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
  const candidates: string[] = [baseUrl];

  if (typeof window !== 'undefined' && baseUrl.startsWith('/')) {
    const { hostname, protocol } = window.location;
    const appApiProtocol = protocol === 'https:' ? 'https:' : 'http:';

    if (hostname) {
      candidates.push(`${appApiProtocol}//${hostname}:8788${baseUrl}`);
    }

    candidates.push(`http://127.0.0.1:8788${baseUrl}`);
    candidates.push(`http://localhost:8788${baseUrl}`);
  }

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
    const payload = (await response.json()) as AppApiErrorPayload & { message?: string };
    if (payload.error?.code === APP_API_ERROR_CODE.UNAUTHORIZED) {
      return '登录状态已失效，请重新登录后再试。';
    }
    if (payload.error?.code === APP_API_ERROR_CODE.FORBIDDEN) {
      return '当前账号没有权限执行这个操作。';
    }
    return payload.error?.message || payload.message || `主业务 API 请求失败 (${response.status})`;
  } catch {
    return `主业务 API 请求失败 (${response.status})`;
  }
}

async function requestJson<T>(baseUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
  const candidateBaseUrls = resolveCandidateBaseUrls(baseUrl);
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

      throw new HttpResponseError(await parseErrorMessage(response));
    } catch (error) {
      if (error instanceof HttpResponseError) {
        throw error;
      }

      lastError = error;
    }
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
