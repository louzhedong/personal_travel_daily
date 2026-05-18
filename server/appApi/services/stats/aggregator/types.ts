import type { TravelScope } from '@prisma/client';
import type { getStatsOverviewSource } from '../../../repositories/statsRepository.js';

type RawStatsSource = NonNullable<Awaited<ReturnType<typeof getStatsOverviewSource>>>;

export type RawCompanion = RawStatsSource['companions'][number];
export type RawTrip = RawStatsSource['trips'][number];
export type RawMarker = RawStatsSource['markers'][number];

export type AggregatedRegion = {
  scopeId: string;
  scopeName: string;
  scope: TravelScope;
  markerCount: number;
};
