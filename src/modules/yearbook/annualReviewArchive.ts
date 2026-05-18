import type { AnnualReviewResponseDto } from '../../lib/api/types';
import {
  buildImageUrlList,
  buildMarkdownSummary,
  exportLocalArchivePackage,
  uniqueImageUrls,
} from '../archive/localArchive';
import { formatAnnualReviewMonth } from './annualReviewPageModel';

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildAnnualReviewArchiveSvg(data: AnnualReviewResponseDto) {
  const width = 1200;
  const height = 1500;
  const cover = data.representativePhoto?.imageUrl ?? data.photos[0]?.imageUrl;
  const topTrips = data.trips.slice(0, 4);
  const activeMonths = data.monthlyDistribution.filter((item) => item.markerCount > 0 || item.travelDays > 0).slice(0, 8);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#f8fafc" />
      <text x="92" y="130" fill="#64748b" font-size="30" font-weight="800" letter-spacing="5">TRAVEL YEARBOOK</text>
      <text x="92" y="240" fill="#0f172a" font-size="92" font-weight="900">${escapeSvgText(data.year)} 年度旅行回顾</text>
      <text x="92" y="304" fill="#475569" font-size="34">共 ${data.summary.totalMarkers} 条记录 · ${data.summary.totalTravelDays} 天 · ${data.summary.totalCities} 座城市</text>
      ${
        cover
          ? `<image href="${escapeSvgText(cover)}" x="92" y="370" width="1016" height="420" preserveAspectRatio="xMidYMid slice" />`
          : '<rect x="92" y="370" width="1016" height="420" rx="28" fill="#e2e8f0" />'
      }
      <text x="92" y="890" fill="#64748b" font-size="24" font-weight="800">TOP TRIPS</text>
      ${topTrips
        .map(
          (trip, index) => `
            <text x="92" y="${960 + index * 70}" fill="#0f172a" font-size="34" font-weight="800">${escapeSvgText(trip.tripName)}</text>
            <text x="620" y="${960 + index * 70}" fill="#475569" font-size="28">${trip.markerCount} 条记录 · ${trip.travelDays} 天</text>
          `,
        )
        .join('')}
      <text x="92" y="1280" fill="#64748b" font-size="24" font-weight="800">ACTIVE MONTHS</text>
      ${activeMonths
        .map(
          (month, index) => `
            <text x="${92 + (index % 4) * 250}" y="${1350 + Math.floor(index / 4) * 70}" fill="#334155" font-size="28">${escapeSvgText(formatAnnualReviewMonth(month.month))} · ${month.markerCount} 条</text>
          `,
        )
        .join('')}
    </svg>
  `;
}

export function exportAnnualReviewArchivePackage(data: AnnualReviewResponseDto) {
  const imageUrls = uniqueImageUrls([
    data.representativePhoto?.imageUrl,
    ...data.photos.map((photo) => photo.imageUrl),
  ]);
  const archiveInput = {
    packageType: 'year' as const,
    sourceId: data.year,
    title: `${data.year} 年度旅行回顾`,
    subtitle: `${data.summary.totalMarkers} 条记录，覆盖 ${data.summary.totalCities} 座城市。`,
    generatedAt: data.generatedAt,
    metrics: [
      { label: '旅行记录', value: String(data.summary.totalMarkers) },
      { label: '旅行天数', value: String(data.summary.totalTravelDays) },
      { label: '城市', value: String(data.summary.totalCities) },
      { label: '照片', value: String(data.summary.photoCount) },
    ],
    imageUrls,
  };
  const sections = [
    `## 年度行程\n\n${data.trips.map((trip) => `- ${trip.tripName}: ${trip.markerCount} 条记录，${trip.travelDays} 天`).join('\n') || '暂无年度行程。'}`,
    `## 年度攻略\n\n${data.guides.map((guide) => `- ${guide.title}: ${guide.summary}`).join('\n') || '暂无年度攻略。'}`,
  ];
  const files = [
    { path: 'summary.md', content: buildMarkdownSummary(archiveInput, sections) },
    { path: 'content/annual-review.json', content: `${JSON.stringify(data, null, 2)}\n` },
    { path: 'images/image-urls.md', content: buildImageUrlList(imageUrls) },
    { path: 'exports/annual-review.svg', content: buildAnnualReviewArchiveSvg(data) },
  ];
  return exportLocalArchivePackage(archiveInput, files);
}
