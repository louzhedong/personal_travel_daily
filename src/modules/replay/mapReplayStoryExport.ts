import type { MapReplayStoryResponseDto } from '../../lib/api/types';

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

export function buildMapReplayStoryLongImageSvg(data: MapReplayStoryResponseDto) {
  const width = 1180;
  const rowHeight = 88;
  const replayHeight = Math.max(220, data.replay.length * rowHeight);
  const photoRows = Math.ceil(Math.min(data.photos.length, 6) / 3);
  const height = 640 + replayHeight + photoRows * 250 + data.chapters.length * 160;
  const replayRows = data.replay
    .map((item, index) => {
      const y = 420 + index * rowHeight;
      return `<circle cx="105" cy="${y}" r="13" fill="#0f172a"/><text x="145" y="${y - 8}" fill="#0f172a" font-size="27" font-weight="800">${String(item.order).padStart(2, '0')} · ${escapeSvgText(item.title)}</text><text x="145" y="${y + 28}" fill="#64748b" font-size="21">${item.visitedStartAt} · ${escapeSvgText(item.companion.name)}</text>`;
    })
    .join('');
  const photoY = 470 + replayHeight;
  const photoNodes = data.photos.slice(0, 6).map((photo, index) => {
    const x = 80 + (index % 3) * 340;
    const y = photoY + Math.floor(index / 3) * 250;
    return `<rect x="${x}" y="${y}" width="300" height="185" rx="22" fill="#e2e8f0"/><image href="${escapeSvgText(photo.imageUrl)}" x="${x}" y="${y}" width="300" height="185" preserveAspectRatio="xMidYMid slice"/><text x="${x}" y="${y + 220}" fill="#475569" font-size="19">${escapeSvgText((photo.caption || photo.title).slice(0, 18))}</text>`;
  }).join('');
  const chapterY = photoY + Math.max(1, photoRows) * 250 + 60;
  const chapterNodes = data.chapters.map((chapter, index) => {
    const y = chapterY + index * 160;
    return `<text x="80" y="${y}" fill="#64748b" font-size="20" font-weight="900">${escapeSvgText(chapter.eyebrow.toUpperCase())}</text><text x="80" y="${y + 48}" fill="#0f172a" font-size="38" font-weight="900">${escapeSvgText(chapter.title)}</text><text x="80" y="${y + 92}" fill="#475569" font-size="24">${escapeSvgText(chapter.body.slice(0, 48))}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#f8fafc"/><text x="80" y="105" fill="#64748b" font-size="28" font-weight="900">MAP REPLAY STORY</text><text x="80" y="190" fill="#0f172a" font-size="64" font-weight="900">${escapeSvgText(data.exportModel.posterTitle)}</text><text x="80" y="250" fill="#475569" font-size="30">${escapeSvgText(data.exportModel.posterSubtitle)}</text><rect x="80" y="310" width="1020" height="2" fill="#cbd5e1"/>${replayRows}${photoNodes}${chapterNodes}</svg>`;
}

export function exportMapReplayStoryLongImage(data: MapReplayStoryResponseDto) {
  triggerSvgDownload(buildMapReplayStoryLongImageSvg(data), `${data.exportModel.filenameSlug}-map-replay-story.svg`);
}
