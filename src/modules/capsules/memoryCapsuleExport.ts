import type { MemoryCapsuleDetailDto } from '../../lib/api/types';
import { getVisibleCapsulePhotos } from './memoryCapsulePageModel';
import {
  buildImageUrlList,
  buildMarkdownSummary,
  exportLocalArchivePackage,
  uniqueImageUrls,
} from '../archive/localArchive';

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapText(value: string, maxChars: number) {
  const text = value.trim();
  if (!text) return [''];
  const lines: string[] = [];
  for (let index = 0; index < text.length; index += maxChars) {
    lines.push(text.slice(index, index + maxChars));
  }
  return lines;
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

function templateBackground(template: MemoryCapsuleDetailDto['capsule']['template']) {
  if (template === 'memoir') return '#fff7ed';
  if (template === 'postcard') return '#ecfeff';
  if (template === 'atlas') return '#f0fdf4';
  return '#f8fafc';
}

export function buildMemoryCapsuleLongImageSvg(detail: MemoryCapsuleDetailDto) {
  const width = 1200;
  const contentX = 96;
  const elements: string[] = [];
  let cursorY = 120;
  const background = templateBackground(detail.capsule.template);

  const addText = (text: string, y: number, options: { size?: number; weight?: number; fill?: string; x?: number } = {}) => {
    elements.push(
      `<text x="${options.x ?? contentX}" y="${y}" fill="${options.fill ?? '#334155'}" font-size="${options.size ?? 26}"${options.weight ? ` font-weight="${options.weight}"` : ''}>${escapeSvgText(text)}</text>`,
    );
  };
  const addWrappedText = (text: string, y: number, maxChars = 34, size = 28) => {
    wrapText(text, maxChars).forEach((line, index) => addText(line, y + index * Math.round(size * 1.45), { size }));
    cursorY = y + Math.max(1, wrapText(text, maxChars).length) * Math.round(size * 1.45);
  };

  addText('TRAVEL CAPSULE', cursorY, { size: 28, weight: 800, fill: '#64748b' });
  cursorY += 74;
  addWrappedText(detail.capsule.title, cursorY, 12, 70);
  cursorY += 36;
  addWrappedText(detail.capsule.subtitle ?? detail.content.hero.subtitle ?? '', cursorY, 32, 30);
  cursorY += 42;

  detail.content.metrics.slice(0, 4).forEach((metric, index) => {
    const x = contentX + index * 248;
    elements.push(`<rect x="${x}" y="${cursorY}" width="220" height="104" rx="18" fill="#ffffff" stroke="#e2e8f0" />`);
    addText(metric.label, cursorY + 36, { x: x + 18, size: 20, fill: '#64748b', weight: 700 });
    addText(metric.value, cursorY + 78, { x: x + 18, size: 36, fill: '#0f172a', weight: 900 });
  });
  cursorY += 160;

  detail.content.sections.forEach((section) => {
    addText(section.eyebrow.toUpperCase(), cursorY, { size: 18, weight: 800, fill: '#64748b' });
    cursorY += 42;
    addText(section.title, cursorY, { size: 42, weight: 900, fill: '#0f172a' });
    cursorY += 48;
    addWrappedText(section.body, cursorY, 38, 27);
    cursorY += 34;
  });

  const photos = getVisibleCapsulePhotos(detail.content, 9);
  if (photos.length > 0) {
    addText('PHOTOS', cursorY, { size: 18, weight: 800, fill: '#64748b' });
    cursorY += 46;
    photos.forEach((photo, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const x = contentX + column * 336;
      const y = cursorY + row * 210;
      elements.push(`<rect x="${x}" y="${y}" width="304" height="180" rx="18" fill="#e2e8f0" />`);
      elements.push(`<image href="${escapeSvgText(photo.imageUrl)}" x="${x}" y="${y}" width="304" height="180" preserveAspectRatio="xMidYMid slice" />`);
      addText(photo.caption || photo.title, y + 206, { x, size: 18, fill: '#475569' });
    });
    cursorY += Math.ceil(photos.length / 3) * 236;
  }

  const height = cursorY + 96;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${background}" />${elements.join('')}</svg>`;
}

export function buildMemoryCapsuleShareCardSvg(detail: MemoryCapsuleDetailDto, variant: 'square' | 'story') {
  const width = 1080;
  const height = variant === 'square' ? 1080 : 1920;
  const cover = detail.content.hero.coverImageUrl;
  const background = templateBackground(detail.capsule.template);
  const metrics = detail.content.metrics.slice(0, 3);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${background}" />${cover ? `<image href="${escapeSvgText(cover)}" x="80" y="90" width="920" height="${variant === 'square' ? 430 : 760}" preserveAspectRatio="xMidYMid slice" />` : ''}<text x="80" y="${variant === 'square' ? 620 : 980}" fill="#64748b" font-size="32" font-weight="800">TRAVEL CAPSULE</text><text x="80" y="${variant === 'square' ? 710 : 1090}" fill="#0f172a" font-size="72" font-weight="900">${escapeSvgText(detail.capsule.title.slice(0, 16))}</text>${metrics.map((metric, index) => `<text x="80" y="${variant === 'square' ? 810 + index * 62 : 1230 + index * 78}" fill="#334155" font-size="38" font-weight="800">${escapeSvgText(metric.label)} · ${escapeSvgText(metric.value)}</text>`).join('')}</svg>`;
}

export function exportMemoryCapsuleLongImage(detail: MemoryCapsuleDetailDto) {
  triggerSvgDownload(buildMemoryCapsuleLongImageSvg(detail), `${detail.capsule.title}-旅行胶囊.svg`);
}

export function exportMemoryCapsuleShareCard(detail: MemoryCapsuleDetailDto, variant: 'square' | 'story') {
  triggerSvgDownload(buildMemoryCapsuleShareCardSvg(detail, variant), `${detail.capsule.title}-${variant}.svg`);
}

export function exportMemoryCapsuleArchivePackage(detail: MemoryCapsuleDetailDto) {
  const photos = getVisibleCapsulePhotos(detail.content);
  const imageUrls = uniqueImageUrls([
    detail.content.hero.coverImageUrl,
    detail.capsule.coverImageUrl,
    ...photos.map((photo) => photo.imageUrl),
  ]);
  const archiveInput = {
    packageType: 'capsule' as const,
    sourceId: detail.capsule.id,
    title: detail.capsule.title,
    subtitle: detail.capsule.subtitle ?? detail.content.hero.subtitle,
    sourceUpdatedAt: detail.capsule.updatedAt,
    metrics: detail.content.metrics.map((metric) => ({
      label: metric.label,
      value: metric.value,
      description: metric.description,
    })),
    imageUrls,
  };
  const files = [
    {
      path: 'summary.md',
      content: buildMarkdownSummary(
        archiveInput,
        detail.content.sections.map((section) => `## ${section.title}\n\n${section.body}`),
      ),
    },
    { path: 'content/capsule.json', content: `${JSON.stringify(detail, null, 2)}\n` },
    { path: 'images/image-urls.md', content: buildImageUrlList(imageUrls) },
    { path: 'exports/capsule-long-image.svg', content: buildMemoryCapsuleLongImageSvg(detail) },
  ];
  return exportLocalArchivePackage(archiveInput, files);
}
