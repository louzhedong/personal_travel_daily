import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAnnualReviewRoute,
  createHomeRoute,
  createTripChecklistRoute,
  createTripDetailRoute,
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
    expect(parsePathname('/admin')).toEqual({ kind: 'admin', pathname: '/admin' });
    expect(parsePathname('/stats')).toEqual({ kind: 'stats', pathname: '/stats' });
    expect(parsePathname('/trips/trip-1')).toEqual({
      kind: 'tripDetail',
      pathname: '/trips/trip-1',
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
    expect(createAnnualReviewRoute('2026/summary')).toEqual({
      kind: 'annualReview',
      pathname: '/yearbook/2026%2Fsummary',
      year: '2026/summary',
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
      result.current.goBack();
    });
    expect(backSpy).toHaveBeenCalledOnce();
  });
});
