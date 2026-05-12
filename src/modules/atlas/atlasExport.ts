import type { AtlasTimelineResponseDto } from '../../lib/api/types';

function escapeSvgText(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function triggerSvgDownload(svg: string, filename: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function buildAtlasPosterSvg(data: AtlasTimelineResponseDto) {
  const width = 1080;
  const height = 1350;
  const regions = data.placeIndex.regions.slice(0, 8);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#f8fafc"/><text x="80" y="140" fill="#64748b" font-size="30" font-weight="800">TRAVEL ATLAS</text><text x="80" y="245" fill="#0f172a" font-size="82" font-weight="900">地图时间机器</text><text x="80" y="310" fill="#475569" font-size="34">${escapeSvgText(data.exportModel.posterSubtitle)}</text><rect x="80" y="390" width="920" height="480" rx="42" fill="#e2e8f0"/>${regions.map((region, index) => `<circle cx="${180 + (index % 4) * 220}" cy="${500 + Math.floor(index / 4) * 170}" r="${26 + Math.min(region.markerCount, 18)}" fill="#0f172a" opacity="0.18"/><text x="${145 + (index % 4) * 220}" y="${575 + Math.floor(index / 4) * 170}" fill="#334155" font-size="24" font-weight="800">${escapeSvgText(region.scopeName)}</text>`).join('')}<text x="80" y="980" fill="#0f172a" font-size="46" font-weight="900">${escapeSvgText(data.exportModel.indexTitle)}</text>${regions.slice(0, 6).map((region, index) => `<text x="80" y="${1050 + index * 44}" fill="#475569" font-size="28">${String(index + 1).padStart(2, '0')} · ${escapeSvgText(region.scopeName)} · ${region.markerCount} 段记录</text>`).join('')}</svg>`;
}

export function buildAtlasIndexSvg(data: AtlasTimelineResponseDto) {
  const width = 1100;
  const rowHeight = 54;
  const height = 220 + data.placeIndex.regions.reduce((sum, region) => sum + 72 + region.cities.length * rowHeight, 0);
  let y = 150;
  const rows: string[] = [];
  data.placeIndex.regions.forEach((region, regionIndex) => {
    rows.push(`<text x="80" y="${y}" fill="#0f172a" font-size="36" font-weight="900">${String(regionIndex + 1).padStart(2, '0')} ${escapeSvgText(region.scopeName)}</text>`);
    y += 54;
    region.cities.forEach((city) => {
      rows.push(`<text x="118" y="${y}" fill="#475569" font-size="26">${escapeSvgText(city.city)} · ${city.markerCount} 段 · ${city.photoCount} 张照片</text>`);
      y += rowHeight;
    });
    y += 28;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#f8fafc"/><text x="80" y="80" fill="#64748b" font-size="24" font-weight="900">PLACE INDEX</text>${rows.join('')}</svg>`;
}

export function buildAtlasReplaySvg(data: AtlasTimelineResponseDto) {
  const width = 1280;
  const height = Math.max(720, 180 + data.replay.length * 82);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#f8fafc"/><text x="90" y="90" fill="#64748b" font-size="26" font-weight="900">ROUTE REPLAY</text><text x="90" y="150" fill="#0f172a" font-size="48" font-weight="900">${escapeSvgText(data.exportModel.routeTitle)}</text>${data.replay.map((item, index) => `<circle cx="120" cy="${240 + index * 82}" r="13" fill="#0f172a"/><line x1="120" y1="${253 + index * 82}" x2="120" y2="${305 + index * 82}" stroke="#cbd5e1" stroke-width="3"/><text x="160" y="${248 + index * 82}" fill="#0f172a" font-size="28" font-weight="800">${String(item.order).padStart(2, '0')} · ${escapeSvgText(item.title)}</text><text x="160" y="${284 + index * 82}" fill="#64748b" font-size="22">${item.visitedStartAt} · ${escapeSvgText(item.companion.name)}</text>`).join('')}</svg>`;
}

export function exportAtlasPoster(data: AtlasTimelineResponseDto) {
  triggerSvgDownload(buildAtlasPosterSvg(data), 'travel-atlas-poster.svg');
}

export function exportAtlasIndex(data: AtlasTimelineResponseDto) {
  triggerSvgDownload(buildAtlasIndexSvg(data), 'travel-atlas-index.svg');
}

export function exportAtlasReplay(data: AtlasTimelineResponseDto) {
  triggerSvgDownload(buildAtlasReplaySvg(data), 'travel-atlas-replay.svg');
}
