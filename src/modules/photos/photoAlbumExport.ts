import type { PhotoAlbumDto } from '../../lib/api/types';

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

export function buildPhotoAlbumSvg(album: PhotoAlbumDto) {
  const width = 1200;
  const height = 900;
  const photos = album.coverCandidates.slice(0, 6);
  const cells = photos.map((photo, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = 80 + column * 352;
    const y = 286 + row * 250;
    return [
      `<rect x="${x}" y="${y}" width="312" height="202" rx="22" fill="#e2e8f0" />`,
      `<image href="${escapeSvgText(photo.imageUrl)}" x="${x}" y="${y}" width="312" height="202" preserveAspectRatio="xMidYMid slice" />`,
      `<text x="${x}" y="${y + 232}" fill="#475569" font-size="22" font-weight="700">${escapeSvgText((photo.caption || photo.markerTitle).slice(0, 18))}</text>`,
    ].join('');
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#f8fafc" /><text x="80" y="110" fill="#64748b" font-size="26" font-weight="800">SMART PHOTO ALBUM</text><text x="80" y="190" fill="#0f172a" font-size="66" font-weight="900">${escapeSvgText(album.title.slice(0, 18))}</text><text x="80" y="240" fill="#475569" font-size="28">${escapeSvgText(album.subtitle.slice(0, 36))}</text>${cells.join('')}</svg>`;
}

export function exportPhotoAlbumSvg(album: PhotoAlbumDto) {
  triggerSvgDownload(buildPhotoAlbumSvg(album), `${album.title}-精选相册.svg`);
}
