// 地图区域样式工具集 / Map region style helpers.
// 集中维护颜色映射与哈希函数，供 TravelMap 及其子组件复用。
// Centralises color/hue mapping and hashing helpers shared by TravelMap and its child components.

import type { CSSProperties } from 'react';
import type { Scope } from '../../types';

// 国际地图使用的色相池 / Hue pool used on the international map.
export const INTERNATIONAL_REGION_HUES = [18, 35, 52, 142, 196, 222, 262, 322];

/**
 * 简单字符串哈希 / Simple deterministic string hash.
 * 用于将 regionId 映射到稳定的颜色索引。
 * Used to map regionId to a stable color index.
 */
export function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/**
 * 根据 scope / 标记数量构造区域样式变量 / Build CSS variables for a region based on scope and marker count.
 * 返回的对象会作为内联 style 赋予 path，map.css 会读取这些变量。
 * The returned object is applied as inline style; map.css reads these variables.
 */
export function buildRegionStyle(
  scope: Scope,
  regionId: string,
  markerCount: number,
  maxCount: number,
  wishlistCount = 0,
): CSSProperties {
  if (wishlistCount > 0 && markerCount <= 0) {
    return {
      '--region-fill': 'rgba(245, 158, 11, 0.2)',
      '--region-stroke': 'rgba(217, 119, 6, 0.72)',
      '--region-stroke-width': '1.35',
      '--region-fill-hover': 'rgba(245, 158, 11, 0.38)',
      '--region-stroke-hover': 'rgba(180, 83, 9, 0.92)',
    } as CSSProperties;
  }

  if (markerCount <= 0 || maxCount <= 0) {
    return {};
  }

  const ratio = Math.max(0, Math.min(1, markerCount / maxCount));

  if (scope === 'international') {
    const hue = INTERNATIONAL_REGION_HUES[hashString(regionId) % INTERNATIONAL_REGION_HUES.length];
    const fillAlpha = 0.18 + ratio * 0.22;
    const strokeAlpha = 0.58 + ratio * 0.2;
    return {
      '--region-fill': wishlistCount > 0 ? `hsla(158, 72%, 43%, ${Math.min(0.5, fillAlpha + 0.16)})` : `hsla(${hue}, 82%, 58%, ${fillAlpha})`,
      '--region-stroke': `hsla(${hue}, 76%, 38%, ${strokeAlpha})`,
      '--region-stroke-width': `${1.05 + ratio * 0.55}`,
      '--region-fill-hover': `hsla(${hue}, 88%, 54%, ${Math.min(0.84, fillAlpha + 0.2)})`,
      '--region-stroke-hover': `hsla(${hue}, 82%, 30%, ${Math.min(0.96, strokeAlpha + 0.16)})`,
    } as CSSProperties;
  }

  return {
    '--region-fill': wishlistCount > 0 ? `rgba(16, 185, 129, ${0.24 + ratio * 0.2})` : `rgba(20, 184, 166, ${0.14 + ratio * 0.18})`,
    '--region-stroke': `rgba(13, 148, 136, ${0.52 + ratio * 0.24})`,
    '--region-stroke-width': `${1 + ratio * 0.45}`,
    '--region-fill-hover': `rgba(20, 184, 166, ${Math.min(0.46, 0.24 + ratio * 0.24)})`,
    '--region-stroke-hover': `rgba(15, 118, 110, ${Math.min(0.92, 0.7 + ratio * 0.16)})`,
  } as CSSProperties;
}
