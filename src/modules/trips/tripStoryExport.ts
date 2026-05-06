import type {
  TripStoryShareCardVariant,
  TripStoryTemplate,
  TripStoryViewModel,
} from './tripStoryPageModel';

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function wrapText(value: string, maxChars: number) {
  const text = value.trim();
  if (!text) {
    return [''];
  }
  const lines: string[] = [];
  for (let index = 0; index < text.length; index += maxChars) {
    lines.push(text.slice(index, index + maxChars));
  }
  return lines;
}

function getTemplateBackground(template: TripStoryTemplate) {
  if (template === 'memoir') return '#fff7ed';
  if (template === 'postcard') return '#ecfeff';
  return '#f8fafc';
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

export function buildTripStoryLongImageSvg(story: TripStoryViewModel, template: TripStoryTemplate) {
  const width = 1200;
  const contentX = 96;
  const background = getTemplateBackground(template);
  const elements: string[] = [];
  let cursorY = 128;

  const addText = (input: {
    text: string;
    x?: number;
    y?: number;
    fill?: string;
    fontSize?: number;
    fontWeight?: number;
    letterSpacing?: number;
  }) => {
    elements.push(
      `<text x="${input.x ?? contentX}" y="${input.y ?? cursorY}" fill="${input.fill ?? '#334155'}" font-size="${input.fontSize ?? 26}"${input.fontWeight ? ` font-weight="${input.fontWeight}"` : ''}${input.letterSpacing ? ` letter-spacing="${input.letterSpacing}"` : ''}>${escapeSvgText(input.text)}</text>`,
    );
  };

  const addClippedImage = (input: {
    href: string;
    x: number;
    y: number;
    width: number;
    height: number;
    clipId: string;
  }) => {
    elements.push(`
      <clipPath id="${input.clipId}">
        <rect x="${input.x}" y="${input.y}" width="${input.width}" height="${input.height}" rx="16" />
      </clipPath>
      <image href="${escapeSvgText(input.href)}" x="${input.x}" y="${input.y}" width="${input.width}" height="${input.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${input.clipId})" />
    `);
  };

  const addWrappedText = (input: {
    text: string;
    x?: number;
    y?: number;
    fill?: string;
    fontSize?: number;
    fontWeight?: number;
    maxChars?: number;
    lineHeight?: number;
    advance?: boolean;
  }) => {
    const lines = wrapText(input.text, input.maxChars ?? 38);
    const x = input.x ?? contentX;
    const y = input.y ?? cursorY;
    const lineHeight = input.lineHeight ?? Math.round((input.fontSize ?? 26) * 1.45);
    elements.push(
      `<text x="${x}" y="${y}" fill="${input.fill ?? '#334155'}" font-size="${input.fontSize ?? 26}"${input.fontWeight ? ` font-weight="${input.fontWeight}"` : ''}>${lines
        .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeSvgText(line)}</tspan>`)
        .join('')}</text>`,
    );
    if (input.advance !== false) {
      cursorY = Math.max(cursorY, y + Math.max(1, lines.length - 1) * lineHeight + lineHeight);
    }
  };

  const addSectionTitle = (title: string, eyebrow: string) => {
    cursorY += 56;
    addText({ text: eyebrow.toUpperCase(), y: cursorY, fill: '#2563eb', fontSize: 22, fontWeight: 700, letterSpacing: 4 });
    cursorY += 54;
    addText({ text: title, y: cursorY, fill: '#0f172a', fontSize: 42, fontWeight: 800 });
    cursorY += 72;
  };

  addText({ text: 'TRAVEL STORY', y: cursorY, fill: '#2563eb', fontSize: 30, fontWeight: 700, letterSpacing: 6 });
  cursorY += 92;
  addWrappedText({ text: story.title, y: cursorY, fill: '#0f172a', fontSize: 70, fontWeight: 800, maxChars: 12, lineHeight: 82 });
  cursorY += 48;
  addText({ text: story.dateRange, y: cursorY, fill: '#475569', fontSize: 30 });
  cursorY += 64;
  addWrappedText({ text: story.summaryText, y: cursorY, fill: '#334155', fontSize: 30, maxChars: 32, lineHeight: 46 });

  addSectionTitle('故事徽章', 'badges');
  story.badges.forEach((badge, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = contentX + column * 504;
    const y = cursorY + row * 118;
    elements.push(`<rect x="${x}" y="${y - 34}" width="456" height="92" rx="14" fill="#f8fafc" stroke="#e2e8f0" />`);
    addText({ text: badge.label, x: x + 22, y, fill: '#64748b', fontSize: 22, fontWeight: 700 });
    addText({ text: badge.value, x: x + 22, y: y + 40, fill: '#0f172a', fontSize: 34, fontWeight: 800 });
    addText({ text: truncateText(badge.description, 18), x: x + 130, y: y + 40, fill: '#475569', fontSize: 22 });
  });
  cursorY += Math.ceil(story.badges.length / 2) * 118 + 10;

  addSectionTitle('故事摘要', 'brief');
  story.highlights.forEach((item, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = contentX + column * 504;
    const y = cursorY + row * 118;
    elements.push(`<rect x="${x}" y="${y - 34}" width="456" height="92" rx="14" fill="#f8fafc" stroke="#e2e8f0" />`);
    addText({ text: item.label, x: x + 22, y, fill: '#64748b', fontSize: 22, fontWeight: 700 });
    addText({ text: item.value, x: x + 22, y: y + 40, fill: '#0f172a', fontSize: 34, fontWeight: 800 });
    addText({ text: truncateText(item.description, 18), x: x + 130, y: y + 40, fill: '#475569', fontSize: 22 });
  });
  cursorY += Math.ceil(story.highlights.length / 2) * 118 + 10;

  addSectionTitle('智能故事序言', 'narrative');
  addWrappedText({ text: story.smartNarrative, y: cursorY, fill: '#334155', fontSize: 28, maxChars: 35, lineHeight: 42 });

  if (story.featuredPhotos.length > 0) {
    addSectionTitle('精选瞬间', 'featured');
    const featuredStartY = cursorY;
    story.featuredPhotos.forEach((photo, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = contentX + column * 504;
      const y = featuredStartY + row * 252;
      elements.push(`<rect x="${x}" y="${y}" width="456" height="220" rx="18" fill="#e0f2fe" stroke="#bae6fd" />`);
      addClippedImage({ href: photo.imageUrl, x, y, width: 456, height: 220, clipId: `trip-story-featured-${index}` });
      elements.push(`<rect x="${x}" y="${y + 150}" width="456" height="70" rx="18" fill="rgba(15, 23, 42, 0.66)" />`);
      addText({ text: photo.isFeatured ? '精选照片' : '照片开场', x: x + 20, y: y + 180, fill: '#ffffff', fontSize: 20, fontWeight: 800 });
      addText({ text: truncateText(photo.caption || `${photo.visitedStartAt} · ${photo.markerTitle}`, 20), x: x + 20, y: y + 206, fill: '#e0f2fe', fontSize: 18, fontWeight: 700 });
    });
    cursorY = featuredStartY + Math.ceil(story.featuredPhotos.length / 2) * 252;
  }

  addSectionTitle('路线回放海报', 'route');
  addWrappedText({ text: story.routePoster.stops.length > 0 ? story.routePoster.subtitle : story.routePoster.emptyText, y: cursorY, fill: '#475569', fontSize: 28, maxChars: 35, lineHeight: 40 });
  if (story.routePoster.stops.length > 0) {
    story.routePoster.stops.forEach((stop, index) => {
      const y = cursorY + index * 54;
      elements.push(`<circle cx="${contentX + 12}" cy="${y - 8}" r="8" fill="${escapeSvgText(stop.companionColor)}" />`);
      addText({ text: `${stop.date} · ${stop.label}`, x: contentX + 38, y, fill: '#334155', fontSize: 26 });
    });
    cursorY += story.routePoster.stops.length * 54 + 4;
  }

  addSectionTitle('时间线叙事', 'timeline');
  if (story.timelineDays.length === 0) {
    addWrappedText({ text: '这次行程还没有旅行记录。', y: cursorY, fill: '#64748b', fontSize: 28 });
  } else {
    story.timelineDays.forEach((day) => {
      addText({ text: `${day.date} · ${day.title}`, y: cursorY, fill: '#0f172a', fontSize: 30, fontWeight: 800 });
      cursorY += 42;
      day.markers.forEach((marker) => {
        addWrappedText({
          text: `${marker.scopeName} · ${marker.city}｜${marker.displayRange}｜${marker.note || '暂无游记'}${marker.metadataLabels.length ? `｜${marker.metadataLabels.join(' / ')}` : ''}`,
          y: cursorY,
          fill: '#475569',
          fontSize: 24,
          maxChars: 44,
          lineHeight: 34,
        });
        cursorY += 10;
      });
      cursorY += 18;
    });
  }

  addSectionTitle('照片段落', 'photos');
  const photos = story.photoSections.flatMap((section) =>
    section.photos.map((photo, index) => ({
      ...photo,
      displayIndex: index + 1,
      date: section.title,
    })),
  );
  if (photos.length === 0) {
    addWrappedText({ text: '这次旅行还没有照片，后续补图后故事页会自动展示。', y: cursorY, fill: '#64748b', fontSize: 28 });
  } else {
    const photoStartY = cursorY;
    photos.forEach((photo, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const x = contentX + column * 336;
      const y = photoStartY + row * 154;
      elements.push(`<rect x="${x}" y="${y}" width="304" height="128" rx="16" fill="#e0f2fe" stroke="#bae6fd" />`);
      addClippedImage({ href: photo.imageUrl, x, y, width: 304, height: 128, clipId: `trip-story-photo-${index}` });
      elements.push(`<rect x="${x}" y="${y + 78}" width="304" height="50" rx="16" fill="rgba(15, 23, 42, 0.62)" />`);
      addText({ text: photo.isFeatured ? 'FEATURED' : `PHOTO ${String(index + 1).padStart(2, '0')}`, x: x + 18, y: y + 104, fill: '#ffffff', fontSize: 18, fontWeight: 800 });
      addText({ text: truncateText(photo.caption || `${photo.date} · ${photo.markerTitle}`, 16), x: x + 120, y: y + 104, fill: '#e0f2fe', fontSize: 18, fontWeight: 700 });
    });
    cursorY = photoStartY + Math.ceil(photos.length / 3) * 154;
  }

  addSectionTitle('攻略摘录', 'guides');
  if (story.guides.length === 0) {
    addWrappedText({ text: '这次行程还没有关联攻略。', y: cursorY, fill: '#64748b', fontSize: 28 });
  } else {
    story.guides.forEach((guide) => {
      addText({ text: guide.result.sourceName, y: cursorY, fill: '#2563eb', fontSize: 22, fontWeight: 700 });
      cursorY += 38;
      addWrappedText({ text: guide.result.title, y: cursorY, fill: '#0f172a', fontSize: 30, fontWeight: 800, maxChars: 30, lineHeight: 40 });
      addWrappedText({ text: guide.result.summary, y: cursorY, fill: '#475569', fontSize: 24, maxChars: 42, lineHeight: 34 });
      cursorY += 20;
    });
  }

  addSectionTitle('行前清单回顾', 'checklist');
  addWrappedText({ text: story.checklistReview.completionText, y: cursorY, fill: '#334155', fontSize: 28, maxChars: 36, lineHeight: 40 });
  if (story.checklistReview.total > 0) {
    story.checklistReview.groups.forEach((group) => {
      addText({ text: `${group.readableStage} · ${group.itemCount} 项 · ${group.title}`, y: cursorY, fill: '#0f172a', fontSize: 28, fontWeight: 800 });
      cursorY += 40;
      group.items.forEach((item) => {
        addWrappedText({ text: `• ${item.title}`, y: cursorY, fill: '#475569', fontSize: 23, maxChars: 44, lineHeight: 32 });
      });
      cursorY += 14;
    });
  }

  cursorY += 58;
  addText({ text: 'Voyage Atlas · 私有旅行故事长图', y: cursorY, fill: '#94a3b8', fontSize: 24 });
  const height = Math.max(1800, cursorY + 84);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="${background}" />
      <rect x="56" y="56" width="1088" height="${height - 112}" rx="28" fill="#ffffff" stroke="#dbe4ef" />
      ${elements.join('\n')}
    </svg>
  `;
}

export function buildTripStoryShareCardSvg(
  story: TripStoryViewModel,
  template: TripStoryTemplate,
  variant: TripStoryShareCardVariant,
) {
  const width = 1080;
  const height = variant === 'square' ? 1080 : 1920;
  const palette = story.shareCard.palettes[template];
  const imageHeight = variant === 'square' ? 430 : 760;
  const metricY = variant === 'square' ? 825 : 1550;
  const titleLines = wrapText(story.shareCard.title, variant === 'square' ? 9 : 8).slice(0, 3);
  const copyLines = wrapText(story.shareCard.mainCopy, variant === 'square' ? 25 : 22).slice(0, variant === 'square' ? 3 : 5);
  const metrics = story.shareCard.metrics.slice(0, 3);

  const imageLayer = story.shareCard.coverImageUrl
    ? `
      <clipPath id="share-card-cover">
        <rect x="72" y="72" width="936" height="${imageHeight}" rx="30" />
      </clipPath>
      <image href="${escapeSvgText(story.shareCard.coverImageUrl)}" x="72" y="72" width="936" height="${imageHeight}" preserveAspectRatio="xMidYMid slice" clip-path="url(#share-card-cover)" />
      <rect x="72" y="72" width="936" height="${imageHeight}" rx="30" fill="rgba(15, 23, 42, 0.24)" />
    `
    : `<rect x="72" y="72" width="936" height="${imageHeight}" rx="30" fill="${palette.surface}" stroke="${palette.accent}" stroke-opacity="0.22" />`;

  const titleStartY = imageHeight + 170;
  const copyStartY = titleStartY + titleLines.length * 74 + 42;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="${palette.background}" />
      ${imageLayer}
      <text x="96" y="${imageHeight + 128}" fill="${palette.accent}" font-size="30" font-weight="800" letter-spacing="4">VOYAGE ATLAS</text>
      <text x="96" y="${titleStartY}" fill="${palette.text}" font-size="68" font-weight="900">
        ${titleLines.map((line, index) => `<tspan x="96" dy="${index === 0 ? 0 : 78}">${escapeSvgText(line)}</tspan>`).join('')}
      </text>
      <text x="96" y="${copyStartY}" fill="${palette.muted}" font-size="32">
        ${copyLines.map((line, index) => `<tspan x="96" dy="${index === 0 ? 0 : 48}">${escapeSvgText(line)}</tspan>`).join('')}
      </text>
      <text x="96" y="${metricY - 64}" fill="${palette.accent}" font-size="28" font-weight="800">${escapeSvgText(story.shareCard.dateRange)}</text>
      ${metrics
        .map((metric, index) => {
          const x = 96 + index * 310;
          return `
            <rect x="${x}" y="${metricY}" width="278" height="150" rx="24" fill="${palette.surface}" stroke="${palette.accent}" stroke-opacity="0.18" />
            <text x="${x + 24}" y="${metricY + 48}" fill="${palette.muted}" font-size="24" font-weight="700">${escapeSvgText(metric.label)}</text>
            <text x="${x + 24}" y="${metricY + 106}" fill="${palette.text}" font-size="48" font-weight="900">${escapeSvgText(metric.value)}</text>
          `;
        })
        .join('')}
      <text x="96" y="${height - 96}" fill="${palette.muted}" font-size="26">私有旅行故事分享卡</text>
    </svg>
  `;
}

export function exportTripStoryLongImage(story: TripStoryViewModel, template: TripStoryTemplate) {
  triggerSvgDownload(buildTripStoryLongImageSvg(story, template), `${story.title}-旅行故事长图.svg`);
}

export function exportTripStoryShareCard(
  story: TripStoryViewModel,
  template: TripStoryTemplate,
  variant: TripStoryShareCardVariant,
) {
  const suffix = variant === 'square' ? '方形分享卡' : '竖版分享卡';
  triggerSvgDownload(buildTripStoryShareCardSvg(story, template, variant), `${story.title}-${suffix}.svg`);
}
