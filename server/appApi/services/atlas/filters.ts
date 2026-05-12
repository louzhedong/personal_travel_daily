import type { AtlasTimelineQuery } from '../../schemas/atlas.js';
import {
  withBudgetLevelFilter,
  withCompanionFilter,
  withMoodFilter,
  withScopeFilter,
  withTagFilter,
  withTransportFilter,
  withTripFilter,
  withWeatherFilter,
  withYearFilter,
  type RawMarker,
} from '../stats/aggregator.js';

export function withMonthFilter(markers: RawMarker[], month?: string) {
  if (!month) {
    return markers;
  }
  return markers.filter((marker) => marker.visitedStartAt.toISOString().slice(5, 7) === month);
}

export function applyAtlasFilters(markers: RawMarker[], query: AtlasTimelineQuery) {
  return withBudgetLevelFilter(
    withTransportFilter(
      withWeatherFilter(
        withMoodFilter(
          withTagFilter(
            withTripFilter(
              withCompanionFilter(withScopeFilter(withMonthFilter(withYearFilter(markers, query.year), query.month), query.scope), query.companionId),
              query.tripId,
            ),
            query.tag,
          ),
          query.mood,
        ),
        query.weather,
      ),
      query.transport,
    ),
    query.budgetLevel,
  );
}
