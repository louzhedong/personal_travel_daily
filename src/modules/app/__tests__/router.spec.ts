import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAchievementsRoute,
  createAnnualReviewRoute,
  createHomeRoute,
  createMapReplayStoryRoute,
  createOrganizeRoute,
  createPublicShareRoute,
  createTagGovernanceRoute,
  createTripChecklistRoute,
  createTripDetailRoute,
  createTripStoryRoute,
  parsePathname,
  pushRoute,
  replaceRoute,
  useAppRouter,
} from '../router';

describe('router', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    vi.restoreAllMocks();
  });

  it('parses supported pathnames into routes', () => {
    expect(parsePathname('/')).toEqual({ kind: 'home', pathname: '/' });
    expect(parsePathname('/login')).toEqual({ kind: 'login', pathname: '/login' });
    expect(parsePathname('/auth')).toEqual({ kind: 'login', pathname: '/login' });
    expect(parsePathname('/register')).toEqual({ kind: 'register', pathname: '/register' });
    expect(parsePathname('/share/token-1')).toEqual({
      kind: 'publicShare',
      pathname: '/share/token-1',
      token: 'token-1',
    });
    expect(parsePathname('/admin')).toEqual({ kind: 'admin', pathname: '/admin' });
    expect(parsePathname('/stats')).toEqual({ kind: 'stats', pathname: '/stats' });
    expect(parsePathname('/achievements')).toEqual({ kind: 'achievements', pathname: '/achievements' });
    expect(parsePathname('/organize')).toEqual({ kind: 'organize', pathname: '/organize' });
    expect(parsePathname('/tags')).toEqual({ kind: 'tagGovernance', pathname: '/tags' });
    expect(parsePathname('/trips/trip-1')).toEqual({
      kind: 'tripDetail',
      pathname: '/trips/trip-1',
      tripId: 'trip-1',
    });
    expect(parsePathname('/trips/trip-1/story')).toEqual({
      kind: 'tripStory',
      pathname: '/trips/trip-1/story',
      tripId: 'trip-1',
    });
    expect(parsePathname('/trips/trip-1/checklist')).toEqual({
      kind: 'tripChecklist',
      pathname: '/trips/trip-1/checklist',
      tripId: 'trip-1',
    });
    expect(parsePathname('/yearbook/2026')).toEqual({
      kind: 'annualReview',
      pathname: '/yearbook/2026',
      year: '2026',
    });
    expect(parsePathname('/replay/trip/trip-1')).toEqual({
      kind: 'mapReplayStory',
      pathname: '/replay/trip/trip-1',
      targetType: 'trip',
      targetId: 'trip-1',
    });
    expect(parsePathname('/unknown')).toEqual(createHomeRoute());
  });

  it('encodes dynamic route params in route factories', () => {
    expect(createTripDetailRoute('trip/1')).toEqual({
      kind: 'tripDetail',
      pathname: '/trips/trip%2F1',
      tripId: 'trip/1',
    });
    expect(createTripChecklistRoute('trip 1')).toEqual({
      kind: 'tripChecklist',
      pathname: '/trips/trip%201/checklist',
      tripId: 'trip 1',
    });
    expect(createTripStoryRoute('trip 1')).toEqual({
      kind: 'tripStory',
      pathname: '/trips/trip%201/story',
      tripId: 'trip 1',
    });
    expect(createAnnualReviewRoute('2026/summary')).toEqual({
      kind: 'annualReview',
      pathname: '/yearbook/2026%2Fsummary',
      year: '2026/summary',
    });
    expect(createAchievementsRoute()).toEqual({
      kind: 'achievements',
      pathname: '/achievements',
    });
    expect(createOrganizeRoute()).toEqual({
      kind: 'organize',
      pathname: '/organize',
    });
    expect(createTagGovernanceRoute()).toEqual({
      kind: 'tagGovernance',
      pathname: '/tags',
    });
    expect(createPublicShareRoute('token/1')).toEqual({
      kind: 'publicShare',
      pathname: '/share/token%2F1',
      token: 'token/1',
    });
    expect(createMapReplayStoryRoute('companion', 'user/alice')).toEqual({
      kind: 'mapReplayStory',
      pathname: '/replay/companion/user%2Falice',
      targetType: 'companion',
      targetId: 'user/alice',
    });
  });

  it('pushes and replaces history only when pathname changes', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    pushRoute(createTripDetailRoute('trip-1'));
    expect(pushStateSpy).toHaveBeenCalledOnce();
    expect(window.location.pathname).toBe('/trips/trip-1');

    pushRoute(createTripDetailRoute('trip-1'));
    expect(pushStateSpy).toHaveBeenCalledTimes(1);

    replaceRoute(createTripChecklistRoute('trip-1'));
    expect(replaceStateSpy).toHaveBeenCalledOnce();
    expect(window.location.pathname).toBe('/trips/trip-1/checklist');

    replaceRoute(createTripChecklistRoute('trip-1'));
    expect(replaceStateSpy).toHaveBeenCalledTimes(1);
  });

  it('syncs route state through navigate, replace, goBack and popstate', () => {
    window.history.replaceState({}, '', '/stats');
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const { result } = renderHook(() => useAppRouter());

    expect(result.current.route).toEqual({ kind: 'stats', pathname: '/stats' });

    act(() => {
      result.current.navigate(createTripDetailRoute('trip-1'));
    });
    expect(result.current.route).toEqual({
      kind: 'tripDetail',
      pathname: '/trips/trip-1',
      tripId: 'trip-1',
    });
    expect(window.location.pathname).toBe('/trips/trip-1');

    act(() => {
      result.current.replace(createTripChecklistRoute('trip-1'));
    });
    expect(result.current.route).toEqual({
      kind: 'tripChecklist',
      pathname: '/trips/trip-1/checklist',
      tripId: 'trip-1',
    });
    expect(window.location.pathname).toBe('/trips/trip-1/checklist');

    act(() => {
      window.history.pushState({}, '', '/yearbook/2025');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current.route).toEqual({
      kind: 'annualReview',
      pathname: '/yearbook/2025',
      year: '2025',
    });

    act(() => {
      result.current.navigate(createAchievementsRoute());
    });
    expect(result.current.route).toEqual({
      kind: 'achievements',
      pathname: '/achievements',
    });

    act(() => {
      result.current.goBack();
    });
    expect(backSpy).toHaveBeenCalledOnce();
  });
});
