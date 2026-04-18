const SEARCH_TIMEOUT_MS = 8000;
const GEOAPIFY_BASE_URL = 'https://api.geoapify.com';

function readGeoapifyKey() {
  return (
    process.env.GUIDE_POI_GEOAPIFY_API_KEY?.trim()
    || process.env.GEOAPIFY_API_KEY?.trim()
    || ''
  );
}

export function isGeoapifyPoiEnabled() {
  return !!readGeoapifyKey();
}

function normalizeText(value) {
  return `${value ?? ''}`.replace(/\s+/g, ' ').trim();
}

function normalizeCategoryText(values) {
  return values.map((value) => normalizeText(value).toLowerCase()).filter(Boolean).join(' ');
}

function normalizeTagList(...values) {
  const tags = values
    .flatMap((value) => (Array.isArray(value) ? value : `${value ?? ''}`.split(/[;,/|、]/)))
    .map((value) => normalizeText(value))
    .filter(Boolean);

  return [...new Set(tags)].slice(0, 5);
}

function extractRegionAndQuery(keyword) {
  const normalizedKeyword = normalizeText(keyword);
  const tokens = normalizedKeyword.split(/\s+/).filter(Boolean);
  const region = tokens[0] || normalizedKeyword;
  const poiQuery = normalizeText(tokens.slice(1).join(' ')).replace(/攻略|自由行|旅行|旅游/g, '') || '景点';

  return {
    region,
    poiQuery,
    rawKeyword: normalizedKeyword,
  };
}

function isGenericPoiQuery(query) {
  return !query || /^(景点|旅游|旅行|攻略|玩法|去哪|poi|travel|attraction|sight|destination)$/i.test(query);
}

function buildUrl(pathname, params) {
  const url = new URL(pathname, GEOAPIFY_BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  url.searchParams.set('apiKey', readGeoapifyKey());
  return url;
}

async function readJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'VoyageAtlasGuideBot/0.1 (+https://example.local/guide-api)',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`remote fetch failed (${response.status})`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function geocodeRegion(region) {
  const url = buildUrl('/v1/geocode/search', {
    text: region,
    lang: 'zh',
    limit: 1,
    format: 'json',
  });
  const payload = await readJson(url);
  const candidate = Array.isArray(payload.results) ? payload.results[0] : null;
  if (!candidate || typeof candidate.lat !== 'number' || typeof candidate.lon !== 'number') {
    return null;
  }

  return candidate;
}

function buildPlacesFilter(geocodeResult) {
  if (!geocodeResult) {
    return '';
  }

  const lat = Number(geocodeResult.lat);
  const lon = Number(geocodeResult.lon);
  const radius = geocodeResult.result_type === 'city' || geocodeResult.city ? 80000 : 30000;

  return `circle:${lon},${lat},${radius}`;
}

function buildSummary(properties) {
  const locationSummary = [
    properties.state,
    properties.city,
    properties.suburb,
    properties.district,
  ]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(' ');

  const categorySummary = normalizeTagList(properties.categories).join(' / ');
  const address = normalizeText(properties.formatted || properties.address_line2 || properties.address_line1);

  return [locationSummary, categorySummary, address].filter(Boolean).join(' · ') || '实时国内 POI 检索结果';
}

function buildSourceUrl(placeId) {
  return `https://www.geoapify.com/place?id=${encodeURIComponent(placeId)}`;
}

function toCatalogEntry(feature, rawKeyword) {
  const properties = feature?.properties ?? {};
  const placeId = normalizeText(properties.place_id);
  if (!placeId) {
    return null;
  }

  const tags = normalizeTagList(properties.categories);
  return {
    id: `geoapify-poi-${placeId}`,
    scope: 'domestic',
    title: normalizeText(properties.name) || rawKeyword,
    summary: buildSummary(properties),
    sourceName: 'Geoapify POI',
    sourceUrl: buildSourceUrl(placeId),
    authorName: 'Geoapify',
    publishedAt: new Date().toISOString().slice(0, 10),
    destinationLabel: normalizeText(properties.city || properties.state || properties.address_line2),
    tags,
    searchableText: [
      properties.name,
      properties.formatted,
      properties.address_line1,
      properties.address_line2,
      ...(properties.categories ?? []),
    ]
      .map((value) => normalizeText(value))
      .filter(Boolean)
      .join(' '),
    adapterId: 'geoapify-poi',
  };
}

function parsePlaceIdFromSourceUrl(sourceUrl) {
  const url = new URL(sourceUrl);
  if (!url.hostname.includes('geoapify.com')) {
    return null;
  }
  return normalizeText(url.searchParams.get('id'));
}

function buildDetailBlocks(properties) {
  const blocks = [
    {
      id: 'poi-detail-1',
      type: 'section-title',
      text: '地点信息',
    },
  ];

  const locationLine = [
    normalizeText(properties.address_line1),
    normalizeText(properties.address_line2),
    normalizeText(properties.formatted),
  ]
    .filter(Boolean)
    .join(' · ');

  if (locationLine) {
    blocks.push({
      id: 'poi-detail-2',
      type: 'paragraph',
      text: locationLine,
    });
  }

  const tags = normalizeTagList(properties.categories);
  if (tags.length > 0) {
    blocks.push({
      id: 'poi-detail-3',
      type: 'bullet-list',
      text: tags.join(' | '),
    });
  }

  const tips = [];
  if (normalizeText(properties.datasource?.sourcename)) {
    tips.push(`数据源：${normalizeText(properties.datasource.sourcename)}`);
  }
  if (typeof properties.distance === 'number') {
    tips.push(`距离参考中心：${Math.round(properties.distance)}m`);
  }
  if (normalizeText(properties.website)) {
    tips.push(`官网：${normalizeText(properties.website)}`);
  }

  if (tips.length > 0) {
    blocks.push({
      id: 'poi-detail-4',
      type: 'tips',
      text: tips.join(' | '),
    });
  }

  return blocks;
}

function buildPlacesRequests({ filter, pageSize, poiQuery }) {
  const limit = Math.min(12, Math.max(6, pageSize));
  const genericQuery = isGenericPoiQuery(poiQuery);

  return [
    {
      categories: 'tourism.attraction,tourism.sights,tourism,leisure.park,religion.temple',
      filter,
      bias: filter,
      limit,
      lang: 'zh',
      name: genericQuery ? '' : poiQuery,
    },
    {
      categories: 'tourism.attraction,tourism.sights,tourism,leisure.park',
      filter,
      bias: filter,
      limit,
      lang: 'zh',
    },
    {
      categories: 'tourism',
      filter,
      bias: filter,
      limit,
      lang: 'zh',
      text: genericQuery ? '' : poiQuery,
    },
  ];
}

function scoreFeature(properties, rawKeyword, region, poiQuery) {
  const haystack = [
    properties.name,
    properties.city,
    properties.state,
    properties.suburb,
    properties.district,
    properties.formatted,
    properties.address_line1,
    properties.address_line2,
    ...(properties.categories ?? []),
  ]
    .map((value) => normalizeText(value).toLowerCase())
    .join(' ');
  const categories = normalizeCategoryText(properties.categories ?? []);

  const normalizedKeyword = normalizeText(rawKeyword).toLowerCase();
  const normalizedRegion = normalizeText(region).toLowerCase();
  const normalizedPoiQuery = normalizeText(poiQuery).toLowerCase();

  let score = 0;
  if (normalizedRegion && haystack.includes(normalizedRegion)) {
    score += 6;
  }
  if (normalizedKeyword && haystack.includes(normalizedKeyword)) {
    score += 4;
  }
  if (normalizedPoiQuery && !isGenericPoiQuery(normalizedPoiQuery) && haystack.includes(normalizedPoiQuery)) {
    score += 3;
  }
  if (categories.includes('tourism.attraction')) {
    score += 2;
  }
  if (categories.includes('tourism')) {
    score += 1;
  }

  return score;
}

async function searchPlaces(params) {
  const url = buildUrl('/v2/places', params);
  const payload = await readJson(url);
  return Array.isArray(payload.features) ? payload.features : [];
}

export const geoapifyPoiAdapter = {
  id: 'geoapify-poi',
  entries: [],
  async search({ keyword, scope = 'all', pageSize = 6 }) {
    if (scope === 'international' || !isGeoapifyPoiEnabled()) {
      return [];
    }

    const { region, poiQuery, rawKeyword } = extractRegionAndQuery(keyword);
    const geocodeResult = await geocodeRegion(region);
    const filter = buildPlacesFilter(geocodeResult);
    if (!filter) {
      return [];
    }

    const features = [];
    const seenPlaceIds = new Set();

    for (const requestParams of buildPlacesRequests({ filter, pageSize, poiQuery })) {
      const nextFeatures = await searchPlaces(requestParams);
      for (const feature of nextFeatures) {
        const placeId = normalizeText(feature?.properties?.place_id);
        if (!placeId || seenPlaceIds.has(placeId)) {
          continue;
        }

        seenPlaceIds.add(placeId);
        features.push(feature);
      }

      if (features.length >= Math.min(10, pageSize)) {
        break;
      }
    }

    return features
      .sort(
        (left, right) =>
          scoreFeature(right?.properties ?? {}, rawKeyword, region, poiQuery)
          - scoreFeature(left?.properties ?? {}, rawKeyword, region, poiQuery),
      )
      .map((feature) => toCatalogEntry(feature, rawKeyword))
      .filter(Boolean);
  },
  async getDocument(sourceUrl) {
    if (!isGeoapifyPoiEnabled()) {
      return null;
    }

    const placeId = parsePlaceIdFromSourceUrl(sourceUrl);
    if (!placeId) {
      return null;
    }

    const url = buildUrl('/v2/place-details', {
      id: placeId,
      lang: 'zh',
    });

    const payload = await readJson(url);
    const feature = Array.isArray(payload.features) ? payload.features[0] : null;
    const properties = feature?.properties;
    if (!properties) {
      return null;
    }

    return {
      id: `geoapify-poi-${placeId}`,
      title: normalizeText(properties.name) || '国内实时 POI',
      summary: buildSummary(properties),
      sourceName: 'Geoapify POI',
      sourceUrl,
      authorName: 'Geoapify',
      publishedAt: new Date().toISOString().slice(0, 10),
      destinationLabel: normalizeText(properties.city || properties.state || properties.address_line2),
      tags: normalizeTagList(properties.categories),
      blocks: buildDetailBlocks(properties),
      fetchedAt: new Date().toISOString(),
    };
  },
};
