import './loadServerEnv.mjs';
import http from 'node:http';
import { listAdapterEntries, loadDocumentFromAdapters, searchEntriesFromAdapters } from './adapters/index.mjs';
import { loadCachedGuideCatalog, loadCachedGuideDocument, saveCachedGuideDocument } from './guideFileStore.mjs';
import { findGuideDocumentBySourceUrl, searchGuideDocuments } from './guideSearchEngine.mjs';
import { GUIDE_SEED_DOCUMENTS } from './guideSeedData.mjs';

const PORT = Number(process.env.GUIDE_API_PORT || 8383);
const HOST = process.env.GUIDE_API_HOST || '0.0.0.0';

function dedupeBySourceUrl(items) {
  const seenSourceUrls = new Set();
  const seenIds = new Set();

  return [...items].reverse().filter((item) => {
    if (!item?.sourceUrl) {
      return false;
    }
    if (seenSourceUrls.has(item.sourceUrl)) {
      return false;
    }
    if (item.id && seenIds.has(item.id)) {
      return false;
    }

    seenSourceUrls.add(item.sourceUrl);
    if (item.id) {
      seenIds.add(item.id);
    }
    return true;
  }).reverse();
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', (chunk) => {
      raw += chunk;
    });
    request.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function createErrorPayload(code, message) {
  return {
    error: {
      code,
      message,
    },
  };
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    const cachedCatalog = await loadCachedGuideCatalog();
    sendJson(response, 200, {
      ok: true,
      provider: 'guide-api-local',
      adapters: ['qyer-forum', 'geoapify-poi', 'zh-wikivoyage', 'zh-wikipedia', 'domestic-poi-starter', 'kyoto-travel-cn'],
      cachedDocuments: cachedCatalog.length,
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/guides/search') {
    sendJson(
      response,
      405,
      createErrorPayload('METHOD_NOT_ALLOWED', 'use POST /api/guides/search with a JSON body'),
    );
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/guides/search') {
    try {
      const payload = await readJsonBody(request);
      if (!`${payload.keyword ?? ''}`.trim()) {
        sendJson(response, 400, createErrorPayload('INVALID_SEARCH_KEYWORD', 'keyword is required'));
        return;
      }

      const cachedCatalog = await loadCachedGuideCatalog();
      const remoteEntries = await searchEntriesFromAdapters(payload);
      const mergedCatalog = dedupeBySourceUrl([
        ...cachedCatalog,
        ...GUIDE_SEED_DOCUMENTS,
        ...listAdapterEntries(),
        ...remoteEntries,
      ]);

      const result = searchGuideDocuments(mergedCatalog, payload);
      sendJson(response, 200, result);
      return;
    } catch {
      sendJson(response, 400, createErrorPayload('INVALID_JSON', 'request body must be valid JSON'));
      return;
    }
  }

  if (request.method === 'POST' && url.pathname === '/api/guides/document') {
    try {
      const payload = await readJsonBody(request);
      if (!`${payload.sourceUrl ?? ''}`.trim()) {
        sendJson(response, 400, createErrorPayload('INVALID_SOURCE_URL', 'sourceUrl is required'));
        return;
      }

      const seedDocument = findGuideDocumentBySourceUrl(GUIDE_SEED_DOCUMENTS, payload.sourceUrl);
      if (seedDocument) {
        sendJson(response, 200, seedDocument);
        return;
      }

      const cachedDocument = await loadCachedGuideDocument(payload.sourceUrl);
      if (cachedDocument) {
        sendJson(response, 200, cachedDocument);
        return;
      }

      const remoteDocument = await loadDocumentFromAdapters(payload.sourceUrl);
      if (!remoteDocument) {
        sendJson(response, 404, createErrorPayload('GUIDE_DOCUMENT_NOT_FOUND', 'guide document not found'));
        return;
      }

      await saveCachedGuideDocument(remoteDocument);
      sendJson(response, 200, remoteDocument);
      return;
    } catch (error) {
      const isRemoteError = error instanceof Error && error.message.includes('remote fetch failed');
      sendJson(
        response,
        isRemoteError ? 502 : 400,
        createErrorPayload(
          isRemoteError ? 'GUIDE_SOURCE_UNAVAILABLE' : 'INVALID_JSON',
          isRemoteError ? 'remote guide source is temporarily unavailable' : 'request body must be valid JSON',
        ),
      );
      return;
    }
  }

  if (request.method === 'GET' && url.pathname === '/api/guides/document') {
    sendJson(
      response,
      405,
      createErrorPayload('METHOD_NOT_ALLOWED', 'use POST /api/guides/document with a JSON body'),
    );
    return;
  }

  sendJson(response, 404, createErrorPayload('NOT_FOUND', 'route not found'));
});

server.listen(PORT, HOST, () => {
  console.log(`[guide-api] listening on http://${HOST}:${PORT}`);
});
