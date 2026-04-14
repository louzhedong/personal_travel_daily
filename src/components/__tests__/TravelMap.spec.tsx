import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TravelMap from '../TravelMap';
import type { RegionOption, UserProfile, VisitMarker } from '../../types';
import * as loader from '../../geo/loader';

const users: UserProfile[] = [
  { id: 'u1', name: 'A', color: '#2563eb' },
  { id: 'u2', name: 'B', color: '#f97316' },
];

const regions: RegionOption[] = [
  { id: 'bigland', name: 'Bigland', cities: [] },
  { id: 'smallia', name: 'Smallia', cities: [] },
];

const markers: VisitMarker[] = [
  {
    id: 'm1',
    userId: 'u1',
    scope: 'international',
    scopeId: 'bigland',
    scopeName: 'Bigland',
    city: 'City A',
    note: 'a',
    visitedStartAt: '2026-01-01',
    visitedEndAt: '2026-01-02',
    createdAt: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 'm2',
    userId: 'u1',
    scope: 'international',
    scopeId: 'smallia',
    scopeName: 'Smallia',
    city: 'City B',
    note: 'b',
    visitedStartAt: '2026-02-01',
    visitedEndAt: '2026-02-02',
    createdAt: '2026-02-03T00:00:00.000Z',
  },
  {
    id: 'm3',
    userId: 'u2',
    scope: 'international',
    scopeId: 'bigland',
    scopeName: 'Bigland',
    city: 'City C',
    note: 'c',
    visitedStartAt: '2026-01-05',
    visitedEndAt: '2026-01-06',
    createdAt: '2026-01-07T00:00:00.000Z',
  },
  {
    id: 'm4',
    userId: 'u2',
    scope: 'international',
    scopeId: 'smallia',
    scopeName: 'Smallia',
    city: 'City D',
    note: 'd',
    visitedStartAt: '2026-03-01',
    visitedEndAt: '2026-03-02',
    createdAt: '2026-03-03T00:00:00.000Z',
  },
];

const mockedFeatures = [
  {
    id: 'Bigland',
    name: 'Bigland',
    feature: {
      type: 'Feature',
      properties: { name: 'Bigland' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-20, 10], [-20, 45], [20, 45], [20, 10], [-20, 10]]],
      },
    },
  },
  {
    id: 'Smallia',
    name: 'Smallia',
    feature: {
      type: 'Feature',
      properties: { name: 'Smallia' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[55, 5], [55, 5.6], [55.6, 5.6], [55.6, 5], [55, 5]]],
      },
    },
  },
];

describe('TravelMap', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(loader, 'loadGeoForScope').mockResolvedValue(mockedFeatures as never);
  });

  it('shows large-country labels by default and reveals small-country labels after zoom threshold', async () => {
    render(
      <TravelMap
        scope="international"
        regions={regions}
        markers={[] as VisitMarker[]}
        users={users}
        activeUserId="u1"
        onScopeChange={() => {}}
        onSelectRegion={() => {}}
      />,
    );
    expect(await screen.findByText('Bigland')).toBeInTheDocument();
    expect(screen.queryByText('Smallia')).not.toBeInTheDocument();

    const zoomInButton = screen.getByRole('button', { name: '放大' });
    for (let i = 0; i < 12; i += 1) {
      await userEvent.click(zoomInButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Smallia')).toBeInTheDocument();
    });
  });

  it('calls onSelectRegion after clicking a hovered segment', async () => {
    const onSelectRegion = vi.fn();
    const { findByTestId } = render(
      <TravelMap
        scope="international"
        regions={regions}
        markers={[] as VisitMarker[]}
        users={users}
        activeUserId="u1"
        onScopeChange={() => {}}
        onSelectRegion={onSelectRegion}
      />,
    );

    const segment = await findByTestId('segment-Bigland-0');
    fireEvent.pointerMove(segment, { clientX: 100, clientY: 100, pointerId: 1 });
    await waitFor(() => {
      expect(segment).toHaveClass('hover');
    });
    fireEvent.pointerDown(segment, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(segment, { clientX: 100, clientY: 100, pointerId: 1 });

    await waitFor(() => {
      expect(onSelectRegion).toHaveBeenCalledWith(expect.objectContaining({ id: 'bigland', name: 'Bigland' }));
    });
  });

  it('shows journey arcs only for the active user after enabling the route toggle', async () => {
    const { container } = render(
      <TravelMap
        scope="international"
        regions={regions}
        markers={markers}
        users={users}
        activeUserId="u1"
        onScopeChange={() => {}}
        onSelectRegion={() => {}}
      />,
    );

    await screen.findByText('Bigland');
    expect(container.querySelector('.map-journey-arc')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: '显示旅途轨迹' }));

    await waitFor(() => {
      expect(container.querySelectorAll('.map-journey-arc')).toHaveLength(1);
    });
  });
});
