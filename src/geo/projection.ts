import { geoMercator, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo';
import type { Scope } from '../types';

interface SimpleFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: string;
    properties?: Record<string, unknown>;
    geometry: unknown;
  }>;
}

export function projectionFor(
  scope: Scope,
  width: number,
  height: number,
  fc: SimpleFeatureCollection,
): GeoProjection {
  if (scope === 'domestic') {
    return geoMercator().fitExtent(
      [
        [16, 16],
        [width - 16, height - 16],
      ],
      fc as never,
    );
  }
  return geoNaturalEarth1().fitExtent(
    [
      [10, 10],
      [width - 10, height - 10],
    ],
    fc as never,
  );
}

export function pathFor(proj: GeoProjection) {
  return geoPath(proj);
}
