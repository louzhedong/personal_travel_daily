import type { AuthAccount } from '../../types';
import {
  createAdminRoute,
  createAchievementsRoute,
  createAnnualReviewRoute,
  createCompanionMemoriesRoute,
  createHomeRoute,
  createLoginRoute,
  createPhotoCurationRoute,
  createRegisterRoute,
  createSettingsRoute,
  createStatsRoute,
  createTripChecklistRoute,
  createTripDetailRoute,
  createTripStoryRoute,
  type AppRoute,
} from './router';

interface ResolveRestoredRouteInput {
  account: AuthAccount | null;
  route: AppRoute;
}

export interface ResolvedRestoredRoute {
  route: AppRoute;
  entryMessage: string | null;
}

export function resolveRestoredRoute({ account, route }: ResolveRestoredRouteInput): ResolvedRestoredRoute {
  if (!account) {
    return {
      route: route.kind === 'register' ? createRegisterRoute() : createLoginRoute(),
      entryMessage: null,
    };
  }

  if (route.kind === 'admin' && account.role !== 'admin') {
    return {
      route: createHomeRoute(),
      entryMessage: '当前账号没有后台权限，已为你返回旅行主页。',
    };
  }

  if (route.kind === 'admin') {
    return { route: createAdminRoute(), entryMessage: null };
  }

  if (route.kind === 'settings') {
    return { route: createSettingsRoute(), entryMessage: null };
  }

  if (route.kind === 'tripDetail') {
    return { route: createTripDetailRoute(route.tripId), entryMessage: null };
  }

  if (route.kind === 'tripStory') {
    return { route: createTripStoryRoute(route.tripId), entryMessage: null };
  }

  if (route.kind === 'tripChecklist') {
    return { route: createTripChecklistRoute(route.tripId), entryMessage: null };
  }

  if (route.kind === 'annualReview') {
    return { route: createAnnualReviewRoute(route.year), entryMessage: null };
  }

  if (route.kind === 'achievements') {
    return { route: createAchievementsRoute(), entryMessage: null };
  }

  if (route.kind === 'companionMemories') {
    return { route: createCompanionMemoriesRoute(route.companionId), entryMessage: null };
  }

  if (route.kind === 'photoCuration') {
    return { route: createPhotoCurationRoute(route.query), entryMessage: null };
  }

  if (route.kind === 'stats') {
    return { route: createStatsRoute(), entryMessage: null };
  }

  return { route: createHomeRoute(), entryMessage: null };
}
