import { useEffect, useState } from 'react';

/**
 * 应用内手写路由的单一事实源（Single source of truth for the in-app hand-rolled router）。
 *
 * 中文：
 * - 本模块集中承载所有与浏览器 URL 对齐的路由类型、工厂、解析与导航操作，
 *   避免散落在 App.tsx 等顶层组件中。
 * - 如果将来新增一条路由，必须同时更新以下四处，否则会出现 URL 与状态不一致：
 *   1) `AppRoute` 联合类型；
 *   2) 对应的 `createXxxRoute` 工厂函数；
 *   3) `parsePathname`（URL → route）的解析规则；
 *   4) `pathnameFor`（route → URL）的反推实现。
 *
 * English:
 * - This module is the single source of truth for the hand-rolled router that
 *   mirrors the browser URL. It centralises route types, factories, parsing,
 *   and imperative navigation helpers that used to live inside `App.tsx`.
 * - When introducing a new route, you MUST update all four of:
 *   1) the `AppRoute` union;
 *   2) the matching `createXxxRoute` factory;
 *   3) the `parsePathname` mapping (URL → route);
 *   4) the `pathnameFor` reverse mapping (route → URL).
 */

// AppRoute 联合类型：覆盖应用所有顶层导航目标。
// The AppRoute union covers every top-level navigation target in the app.
export type AppRoute =
  | { kind: 'home'; pathname: '/' }
  | { kind: 'login'; pathname: '/login' }
  | { kind: 'register'; pathname: '/register' }
  | { kind: 'settings'; pathname: '/settings' }
  | { kind: 'admin'; pathname: '/admin' }
  | { kind: 'atlas'; pathname: '/atlas' }
  | { kind: 'stats'; pathname: '/stats' }
  | { kind: 'achievements'; pathname: '/achievements' }
  | { kind: 'memoryCapsules'; pathname: '/capsules' }
  | { kind: 'memoryCapsuleDetail'; pathname: string; capsuleId: string }
  | { kind: 'photoCuration'; pathname: string; query: PhotoCurationRouteQuery }
  | { kind: 'companionMemories'; pathname: string; companionId: string }
  | { kind: 'tripDetail'; pathname: string; tripId: string }
  | { kind: 'tripStory'; pathname: string; tripId: string }
  | { kind: 'tripChecklist'; pathname: string; tripId: string }
  | { kind: 'annualReview'; pathname: string; year: string };

// ---------- 路由工厂 / Route factories ----------

export function createHomeRoute(): AppRoute {
  return { kind: 'home', pathname: '/' };
}

export function createLoginRoute(): AppRoute {
  return { kind: 'login', pathname: '/login' };
}

export function createRegisterRoute(): AppRoute {
  return { kind: 'register', pathname: '/register' };
}

export function createSettingsRoute(): AppRoute {
  return { kind: 'settings', pathname: '/settings' };
}

export function createAdminRoute(): AppRoute {
  return { kind: 'admin', pathname: '/admin' };
}

export function createAtlasRoute(): AppRoute {
  return { kind: 'atlas', pathname: '/atlas' };
}

export function createStatsRoute(): AppRoute {
  return { kind: 'stats', pathname: '/stats' };
}

export function createAchievementsRoute(): AppRoute {
  return { kind: 'achievements', pathname: '/achievements' };
}

export function createMemoryCapsulesRoute(): AppRoute {
  return { kind: 'memoryCapsules', pathname: '/capsules' };
}

export function createMemoryCapsuleDetailRoute(capsuleId: string): AppRoute {
  return {
    kind: 'memoryCapsuleDetail',
    pathname: `/capsules/${encodeURIComponent(capsuleId)}`,
    capsuleId,
  };
}

export interface PhotoCurationRouteQuery {
  tripId?: string;
  companionId?: string;
  year?: number;
}

export function createPhotoCurationRoute(query: PhotoCurationRouteQuery = {}): AppRoute {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  });
  const queryString = params.toString();
  return {
    kind: 'photoCuration',
    pathname: queryString ? `/photos?${queryString}` : '/photos',
    query,
  };
}

export function createCompanionMemoriesRoute(companionId: string): AppRoute {
  return {
    kind: 'companionMemories',
    pathname: `/companions/${encodeURIComponent(companionId)}/memories`,
    companionId,
  };
}

export function createTripDetailRoute(tripId: string): AppRoute {
  return {
    kind: 'tripDetail',
    pathname: `/trips/${encodeURIComponent(tripId)}`,
    tripId,
  };
}

export function createTripStoryRoute(tripId: string): AppRoute {
  return {
    kind: 'tripStory',
    pathname: `/trips/${encodeURIComponent(tripId)}/story`,
    tripId,
  };
}

export function createTripChecklistRoute(tripId: string): AppRoute {
  return {
    kind: 'tripChecklist',
    pathname: `/trips/${encodeURIComponent(tripId)}/checklist`,
    tripId,
  };
}

export function createAnnualReviewRoute(year: string): AppRoute {
  return {
    kind: 'annualReview',
    pathname: `/yearbook/${encodeURIComponent(year)}`,
    year,
  };
}

// ---------- 解析 & 反推 / Parsing & reverse mapping ----------

/**
 * 把 pathname 解析为 AppRoute（等价于旧的 normalizePathname）。
 * Parse a pathname into an AppRoute (equivalent to the former normalizePathname).
 */
export function parsePathname(pathname: string, search = ''): AppRoute {
  const memoryCapsuleMatch = pathname.match(/^\/capsules\/([^/]+)$/);
  if (memoryCapsuleMatch) {
    return createMemoryCapsuleDetailRoute(decodeURIComponent(memoryCapsuleMatch[1]));
  }

  const companionMemoriesMatch = pathname.match(/^\/companions\/([^/]+)\/memories$/);
  if (companionMemoriesMatch) {
    return createCompanionMemoriesRoute(decodeURIComponent(companionMemoriesMatch[1]));
  }

  const annualReviewMatch = pathname.match(/^\/yearbook\/(\d{4})$/);
  if (annualReviewMatch) {
    return createAnnualReviewRoute(decodeURIComponent(annualReviewMatch[1]));
  }

  const tripStoryMatch = pathname.match(/^\/trips\/([^/]+)\/story$/);
  if (tripStoryMatch) {
    return createTripStoryRoute(decodeURIComponent(tripStoryMatch[1]));
  }

  const tripChecklistMatch = pathname.match(/^\/trips\/([^/]+)\/checklist$/);
  if (tripChecklistMatch) {
    return createTripChecklistRoute(decodeURIComponent(tripChecklistMatch[1]));
  }

  const tripDetailMatch = pathname.match(/^\/trips\/([^/]+)$/);
  if (tripDetailMatch) {
    return createTripDetailRoute(decodeURIComponent(tripDetailMatch[1]));
  }

  if (pathname === '/admin') {
    return createAdminRoute();
  }

  if (pathname === '/atlas') {
    return createAtlasRoute();
  }

  if (pathname === '/settings') {
    return createSettingsRoute();
  }

  if (pathname === '/stats') {
    return createStatsRoute();
  }

  if (pathname === '/achievements') {
    return createAchievementsRoute();
  }

  if (pathname === '/capsules') {
    return createMemoryCapsulesRoute();
  }

  if (pathname === '/photos') {
    const params = new URLSearchParams(search);
    const year = params.get('year');
    return createPhotoCurationRoute({
      tripId: params.get('tripId') ?? undefined,
      companionId: params.get('companionId') ?? undefined,
      year: year ? Number(year) : undefined,
    });
  }

  if (pathname === '/register') {
    return createRegisterRoute();
  }

  if (pathname === '/login' || pathname === '/auth') {
    return createLoginRoute();
  }

  return createHomeRoute();
}

/**
 * 由 AppRoute 反推出 URL（parsePathname 的对偶）。
 * Derive the URL from an AppRoute (the dual of parsePathname).
 */
export function pathnameFor(route: AppRoute): string {
  return route.pathname;
}

// ---------- 命令式导航 / Imperative navigation ----------

/**
 * 把 route 推入浏览器 history，等效旧代码中散落的 history.pushState 调用。
 * Push the route onto the browser history (replaces the ad-hoc pushState calls).
 */
export function pushRoute(route: AppRoute): void {
  if (typeof window === 'undefined') {
    return;
  }
  const nextPathname = pathnameFor(route);
  if (window.location.pathname !== nextPathname) {
    window.history.pushState({}, '', nextPathname);
  }
}

/**
 * 用 route 替换当前 history 记录（等同旧的 replaceRoute）。
 * Replace the current history entry with the given route (former replaceRoute).
 */
export function replaceRoute(route: AppRoute): void {
  if (typeof window === 'undefined') {
    return;
  }
  const nextPathname = pathnameFor(route);
  if (window.location.pathname !== nextPathname) {
    window.history.replaceState({}, '', nextPathname);
  }
}

// ---------- React 适配层 / React integration ----------

export interface AppRouterApi {
  route: AppRoute;
  navigate: (route: AppRoute) => void;
  replace: (route: AppRoute) => void;
  goBack: () => void;
}

/**
 * useAppRouter：在组件中消费手写路由的统一入口。
 * - `route`：当前路由；
 * - `navigate`：pushState + setState；
 * - `replace`：replaceState + setState；
 * - `goBack`：调用 window.history.back()，后续 popstate 会同步 state。
 *
 * useAppRouter: the canonical hook for consuming the hand-rolled router.
 * - `route`: current route;
 * - `navigate`: pushState + setState;
 * - `replace`: replaceState + setState;
 * - `goBack`: delegates to window.history.back(); the subsequent popstate
 *   event syncs the React state.
 */
export function useAppRouter(): AppRouterApi {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window === 'undefined' ? createHomeRoute() : parsePathname(window.location.pathname, window.location.search),
  );

  useEffect(() => {
    const syncPathname = () => setRoute(parsePathname(window.location.pathname, window.location.search));
    window.addEventListener('popstate', syncPathname);
    return () => {
      window.removeEventListener('popstate', syncPathname);
    };
  }, []);

  const navigate = (nextRoute: AppRoute) => {
    pushRoute(nextRoute);
    setRoute(nextRoute);
  };

  const replace = (nextRoute: AppRoute) => {
    replaceRoute(nextRoute);
    setRoute(nextRoute);
  };

  const goBack = () => {
    if (typeof window === 'undefined') {
      return;
    }
    window.history.back();
  };

  return { route, navigate, replace, goBack };
}
