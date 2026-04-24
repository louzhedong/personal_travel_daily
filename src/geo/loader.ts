import { geoArea } from 'd3-geo';
import type { Scope } from '../types';

// 缓存，避免重复请求
let chinaCache: LoadedFeature[] | null = null;
let worldCache: LoadedFeature[] | null = null;

const LOCAL_CHINA_MAP_URL = '/maps/china-provinces.json';
const LOCAL_WORLD_MAP_URL = '/maps/world-countries.json';

export interface LoadedFeature {
  id: string;
  name: string;
  feature: {
    type: string;
    properties?: Record<string, unknown>;
    geometry: unknown;
  };
}

function reverseChinaGeometry(geometry: unknown) {
  if (!geometry || typeof geometry !== 'object') {
    return geometry;
  }

  const geom = geometry as {
    type?: string;
    coordinates?: unknown;
  };

  if (geom.type === 'Polygon' && Array.isArray(geom.coordinates)) {
    return {
      ...geom,
      coordinates: geom.coordinates.map((ring) =>
        Array.isArray(ring) ? [...ring].reverse() : ring,
      ),
    };
  }

  if (geom.type === 'MultiPolygon' && Array.isArray(geom.coordinates)) {
    return {
      ...geom,
      coordinates: geom.coordinates.map((polygon) =>
        Array.isArray(polygon)
          ? polygon.map((ring) => (Array.isArray(ring) ? [...ring].reverse() : ring))
          : polygon,
      ),
    };
  }

  return geometry;
}

export function normalizeChinaName(rawName: string) {
  return rawName
    .replace(/维吾尔自治区$/, '')
    .replace(/壮族自治区$/, '')
    .replace(/回族自治区$/, '')
    .replace(/自治区$/, '')
    .replace(/特别行政区$/, '')
    .replace(/省$/, '')
    .replace(/市$/, '');
}

async function loadChina(): Promise<LoadedFeature[]> {
  if (chinaCache) return chinaCache;
  const res = await fetch(LOCAL_CHINA_MAP_URL);
  if (!res.ok) {
    throw new Error(`加载本地中国地图失败: ${res.status}`);
  }
  const data = (await res.json()) as {
    features: Array<{
      type: string;
      properties?: Record<string, unknown>;
      geometry: unknown;
    }>;
  };

  chinaCache = data.features
    .filter((feature) => {
      const name = String(feature.properties?.name ?? '');
      return !/南海诸岛/.test(name);
    })
    .map((feature) => {
      const rawName = String(feature.properties?.name ?? '');
      const name = normalizeChinaName(rawName);
      return {
        id: name,
        name,
        feature: {
          ...feature,
          geometry: reverseChinaGeometry(feature.geometry),
        },
      } as LoadedFeature;
    });
  return chinaCache;
}

async function loadWorld(): Promise<LoadedFeature[]> {
  if (worldCache) return worldCache;
  const res = await fetch(LOCAL_WORLD_MAP_URL);
  if (!res.ok) {
    throw new Error(`加载本地世界地图失败: ${res.status}`);
  }
  const worldGeo = (await res.json()) as {
    features: Array<{
      type: string;
      properties?: Record<string, unknown>;
      geometry: unknown;
    }>;
  };
  worldCache = worldGeo.features
    .filter((feature) => {
      const name = String(feature.properties?.name ?? '');
      return name !== '南极洲';
    })
    .map((feature) => {
      const name = String(feature.properties?.name ?? '');
      // d3-geo 基于球面面积判断内外环；若一个国家被误判成“超过半个地球”，说明环方向需要纠正。
      const needsFix = geoArea(feature as never) > 2 * Math.PI;
      const fixed =
        needsFix
          ? {
              ...feature,
              geometry: reverseChinaGeometry(feature.geometry),
            }
          : feature;
      return {
        id: name,
        name,
        feature: fixed,
      };
    });
  return worldCache;
}

export async function loadGeoForScope(scope: Scope): Promise<LoadedFeature[]> {
  return scope === 'domestic' ? loadChina() : loadWorld();
}
