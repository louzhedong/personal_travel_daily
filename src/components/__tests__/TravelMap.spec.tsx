import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TravelMap from '../TravelMap';
import type { RegionOption, UserProfile, VisitMarker } from '../../types';
import * as loader from '../../geo/loader';

const users: UserProfile[] = [
  { id: 'u1', name: 'A', color: '#2563eb' },
];

const regions: RegionOption[] = [
  { id: 'bigland', name: 'Bigland', cities: [] },
  { id: 'smallia', name: 'Smallia', cities: [] },
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
});
