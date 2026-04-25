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

const domesticMarkers: VisitMarker[] = [
  {
    id: 'domestic-1',
    userId: 'u1',
    scope: 'domestic',
    scopeId: 'xinjiang',
    scopeName: '\u65b0\u7586',
    city: '\u4e4c\u9c81\u6728\u9f50',
    note: '\u56fd\u5185\u5730\u56fe\u805a\u5408\u8bb0\u5f55',
    visitedStartAt: '2026-04-01',
    visitedEndAt: '2026-04-03',
    createdAt: '2026-04-04T00:00:00.000Z',
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

const chinaFeature = {
  id: '\u4e2d\u56fd',
  name: '\u4e2d\u56fd',
  feature: {
    type: 'Feature',
    properties: { name: '\u4e2d\u56fd' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[95, 20], [95, 45], [125, 45], [125, 20], [95, 20]]],
    },
  },
};

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
        onOpenSelectedRegionComposer={() => {}}
        onClearSelectedRegion={() => {}}
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
        onOpenSelectedRegionComposer={() => {}}
        onClearSelectedRegion={() => {}}
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
        onOpenSelectedRegionComposer={() => {}}
        onClearSelectedRegion={() => {}}
      />,
    );

    await screen.findByText('Bigland');
    expect(container.querySelector('.map-journey-arc')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: '显示旅途轨迹' }));

    await waitFor(() => {
      expect(container.querySelectorAll('.map-journey-arc')).toHaveLength(1);
    });
  });

  it('starts replay from the active user records in the current map scope', async () => {
    render(
      <TravelMap
        scope="international"
        regions={regions}
        markers={markers}
        users={users}
        activeUserId="u1"
        onScopeChange={() => {}}
        onSelectRegion={() => {}}
        onOpenSelectedRegionComposer={() => {}}
        onClearSelectedRegion={() => {}}
      />,
    );

    await screen.findByText('Bigland');
    expect(screen.getByText('\u0032 \u6761\u8bb0\u5f55\u5df2\u51c6\u5907\u597d')).toBeInTheDocument();
    expect(screen.queryByTestId('map-replay-tag')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '播放地图回放' }));

    expect(screen.getByTestId('map-replay-tag')).toBeInTheDocument();
    expect(screen.getByText('City A')).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 2 .*Bigland.*City A.*2026-01-01 - 2026-01-02/)).toBeInTheDocument();
    expect(screen.queryByText('Bigland 路 City C')).not.toBeInTheDocument();
  });

  it('steps through replay items and resets the active replay state', async () => {
    const { container } = render(
      <TravelMap
        scope="international"
        regions={regions}
        markers={markers}
        users={users}
        activeUserId="u1"
        onScopeChange={() => {}}
        onSelectRegion={() => {}}
        onOpenSelectedRegionComposer={() => {}}
        onClearSelectedRegion={() => {}}
      />,
    );

    await screen.findByText('Bigland');
    await userEvent.click(screen.getByRole('button', { name: '播放地图回放' }));
    await userEvent.click(screen.getByRole('button', { name: '回放下一条' }));

    expect(container.querySelector('.map-replay-transition-arc')).not.toBeNull();
    expect(screen.getByText('City B')).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 2 .*Smallia.*City B.*2026-02-01 - 2026-02-02/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '回放上一条' }));
    expect(container.querySelector('.map-replay-transition-arc')).not.toBeNull();
    expect(screen.getByText('City A')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '结束地图回放' }));
    expect(screen.queryByTestId('map-replay-tag')).not.toBeInTheDocument();
    expect(screen.getByText('\u0032 \u6761\u8bb0\u5f55\u5df2\u51c6\u5907\u597d')).toBeInTheDocument();
  });

  it('does not filter international replay items by the selected region', async () => {
    render(
      <TravelMap
        scope="international"
        regions={regions}
        markers={[
          markers[0],
          markers[1],
          {
            ...markers[1],
            id: 'm5',
            city: 'City E',
            visitedStartAt: '2026-04-01',
            visitedEndAt: '2026-04-02',
            createdAt: '2026-04-03T00:00:00.000Z',
          },
        ]}
        users={users}
        activeUserId="u1"
        selectedRegionId="smallia"
        selectedRegionName="Smallia"
        onScopeChange={() => {}}
        onSelectRegion={() => {}}
        onOpenSelectedRegionComposer={() => {}}
        onClearSelectedRegion={() => {}}
      />,
    );

    await screen.findByText('Bigland');
    await userEvent.click(screen.getByRole('button', { name: '播放地图回放' }));

    expect(screen.getByText('City A')).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 3 .*Bigland.*City A.*2026-01-01 - 2026-01-02/)).toBeInTheDocument();
  });

  it('disables replay when there are fewer than two records', async () => {
    render(
      <TravelMap
        scope="international"
        regions={regions}
        markers={[markers[0]]}
        users={users}
        activeUserId="u1"
        onScopeChange={() => {}}
        onSelectRegion={() => {}}
        onOpenSelectedRegionComposer={() => {}}
        onClearSelectedRegion={() => {}}
      />,
    );

    await screen.findByText('Bigland');

    expect(
      screen.getByText('\u81f3\u5c11\u9700\u8981 2 \u6761\u8bb0\u5f55\u624d\u80fd\u5f00\u59cb\u56de\u653e'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '播放地图回放' })).toBeDisabled();
  });

  it('aggregates domestic markers into China on the international map', async () => {
    vi.spyOn(loader, 'loadGeoForScope').mockResolvedValueOnce([chinaFeature] as never);
    const worldRegions: RegionOption[] = [
      { id: '\u4e2d\u56fd', name: '\u4e2d\u56fd', cities: [] },
    ];
    const { findByTestId } = render(
      <TravelMap
        scope="international"
        regions={worldRegions}
        markers={[]}
        allMarkers={domesticMarkers}
        users={users}
        activeUserId="u1"
        onScopeChange={() => {}}
        onSelectRegion={() => {}}
        onOpenSelectedRegionComposer={() => {}}
        onClearSelectedRegion={() => {}}
      />,
    );

    const segment = await findByTestId('segment-\u4e2d\u56fd-0');

    expect(segment).toHaveClass('visited');
  });
});
