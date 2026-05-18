import type { AtlasPlaceRegionDto, AtlasReplayItemDto } from '../../lib/api/types';

interface AtlasMapProps {
  regions: AtlasPlaceRegionDto[];
  currentItem?: AtlasReplayItemDto;
}

export default function AtlasMap({ regions, currentItem }: AtlasMapProps) {
  const visibleRegions = regions.slice(0, 12);
  const plottedRegions = visibleRegions.map((region, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const x = 104 + column * 210 + (row % 2) * 34 - (index % 3) * 12;
    const y = 116 + row * 126 + (column % 2) * 32 + (index % 2) * 8;
    const radius = 9 + Math.min(region.markerCount, 18) * 0.9;
    const active = currentItem?.scopeId === region.scopeId || currentItem?.scopeName === region.scopeName;
    return { region, index, x, y, radius, active };
  });
  const routePath = plottedRegions.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ');
  return (
    <div className="atlas-map" aria-label="旅行地图时间机器地图">
      <svg viewBox="0 0 920 520" role="img" aria-label="旅行足迹热力地图">
        <defs>
          <linearGradient id="atlas-map-bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#fffdf8" />
            <stop offset="0.58" stopColor="#f4f1ea" />
            <stop offset="1" stopColor="#eef3f1" />
          </linearGradient>
          <pattern id="atlas-map-grid" width="46" height="46" patternUnits="userSpaceOnUse">
            <path d="M46 0H0V46" fill="none" stroke="rgba(16,20,24,0.06)" strokeWidth="1" />
          </pattern>
          <filter id="atlas-map-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#101418" floodOpacity="0.08" />
          </filter>
        </defs>
        <rect x="0" y="0" width="920" height="520" rx="28" fill="url(#atlas-map-bg)" filter="url(#atlas-map-soft-shadow)" />
        <rect x="34" y="34" width="852" height="452" rx="16" fill="url(#atlas-map-grid)" />
        <path d="M54 92H866M54 196H866M54 300H866M54 404H866M160 54V466M344 54V466M528 54V466M712 54V466" stroke="rgba(16,20,24,0.075)" strokeWidth="1" />
        <path d="M58 58H146M58 58V146M862 58H774M862 58V146M58 462H146M58 462V374M862 462H774M862 462V374" stroke="rgba(16,20,24,0.22)" strokeWidth="1.2" />
        <text x="54" y="76" fill="rgba(16,20,24,0.42)" fontSize="12" fontWeight="900" letterSpacing="4">
          MAP PLATE
        </text>
        {routePath ? <path d={routePath} fill="none" stroke="#1f6f68" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 10" opacity="0.78" /> : null}
        {plottedRegions.map(({ region, index, x, y, radius, active }) => {
          return (
            <g key={`${region.scope}:${region.scopeId}`}>
              <circle cx={x} cy={y} r={radius + 12} fill={active ? '#b66a45' : '#101418'} opacity={active ? 0.14 : 0.055} />
              <circle cx={x} cy={y} r={radius} fill={active ? '#b66a45' : '#315d72'} opacity={active ? 0.86 : 0.52} />
              <circle cx={x} cy={y} r="4.8" fill="#101418" />
              <text x={x + radius + 12} y={y - 8} fill="rgba(16,20,24,0.38)" fontSize="11" fontWeight="900">
                {String(index + 1).padStart(2, '0')}
              </text>
              <text x={x + radius + 12} y={y + 12} fill="#101418" fontSize="16" fontWeight="800">
                {region.scopeName}
              </text>
            </g>
          );
        })}
        {currentItem ? (
          <text x="54" y="462" fill="#101418" fontSize="22" fontWeight="900" letterSpacing="-0.5">
            当前 / {currentItem.title} · {currentItem.visitedStartAt}
          </text>
        ) : null}
      </svg>
    </div>
  );
}
