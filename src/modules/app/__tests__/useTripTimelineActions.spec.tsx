import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTripTimelineActions } from '../useTripTimelineActions';

describe('useTripTimelineActions', () => {
  it('opens create dialog with a clean form and resets on close', () => {
    const { result } = renderHook(() => useTripTimelineActions());

    act(() => {
      result.current.openCreateTripDialog();
      result.current.setTripName('北海道雪国行');
      result.current.setTripStartsAt('2026-01-10');
      result.current.setTripEndsAt('2026-01-16');
      result.current.setTripNote('多穿一点');
      result.current.closeTripDialog();
    });

    expect(result.current.tripDialogMode).toBeNull();
    expect(result.current.editingTripId).toBeNull();
    expect(result.current.tripName).toBe('');
    expect(result.current.tripStartsAt).toBe('');
    expect(result.current.tripEndsAt).toBe('');
    expect(result.current.tripNote).toBe('');
  });

  it('opens edit dialog with existing trip fields', () => {
    const { result } = renderHook(() => useTripTimelineActions());

    act(() => {
      result.current.openEditTripDialog({
        id: 'trip-1',
        name: '京都春游',
        note: '记得早点订门票',
        startsAt: '2026-04-01',
        endsAt: '2026-04-05',
        createdAt: '2026-03-01T00:00:00.000Z',
      });
    });

    expect(result.current.tripDialogMode).toBe('edit');
    expect(result.current.editingTripId).toBe('trip-1');
    expect(result.current.tripName).toBe('京都春游');
    expect(result.current.tripStartsAt).toBe('2026-04-01');
    expect(result.current.tripEndsAt).toBe('2026-04-05');
    expect(result.current.tripNote).toBe('记得早点订门票');
    expect(result.current.canSubmitTrip).toBe(true);
  });

  it('validates submit state and manages selection mode state', () => {
    const { result } = renderHook(() => useTripTimelineActions());

    expect(result.current.canSubmitTrip).toBe(false);

    act(() => {
      result.current.setTripName('  ');
      result.current.setTripStartsAt('2026-06-10');
      result.current.setTripEndsAt('2026-06-09');
    });
    expect(result.current.canSubmitTrip).toBe(false);

    act(() => {
      result.current.setTripName('关西游');
      result.current.setTripEndsAt('2026-06-12');
    });
    expect(result.current.canSubmitTrip).toBe(true);

    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleMarkerSelection('marker-1');
      result.current.toggleMarkerSelection('marker-2');
      result.current.toggleMarkerSelection('marker-1');
      result.current.setSelectedMarkerIds((current) => [...current, 'marker-3']);
      result.current.setBatchTripTarget('trip-1');
    });

    expect(result.current.selectionMode).toBe(true);
    expect(result.current.selectedMarkerIds).toEqual(['marker-2', 'marker-3']);
    expect(result.current.batchTripTarget).toBe('trip-1');

    act(() => {
      result.current.exitSelectionMode();
    });

    expect(result.current.selectionMode).toBe(false);
    expect(result.current.selectedMarkerIds).toEqual([]);
    expect(result.current.batchTripTarget).toBe('');
  });
});
