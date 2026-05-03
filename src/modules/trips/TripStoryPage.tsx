import { useEffect, useMemo, useState } from 'react';
import RoutePageSkeleton from '../../components/ui/RoutePageSkeleton';
import { fetchTripDetail } from '../../lib/api/tripsApi';
import type { TripDetailResponseDto } from '../../lib/api/types';
import type { AuthAccount } from '../../types';
import { isTripDetailNotFoundError } from './tripDetailPageModel';
import { buildTripStoryViewModel } from './tripStoryPageModel';

type TripStoryTemplate = 'magazine' | 'memoir';

interface TripStoryPageProps {
  account: AuthAccount;
  tripId: string;
  onNavigateBack: () => void;
  onLogout: () => Promise<void> | void;
}

export default function TripStoryPage({
  account,
  tripId,
  onNavigateBack,
  onLogout,
}: TripStoryPageProps) {
  const [data, setData] = useState<TripDetailResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [template, setTemplate] = useState<TripStoryTemplate>('magazine');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchTripDetail(tripId)
      .then((response) => {
        if (cancelled) {
          return;
        }
        setData(response);
        setErrorMessage('');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setData(null);
        setErrorMessage(error instanceof Error ? error.message : '旅行故事加载失败');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const story = useMemo(() => (data ? buildTripStoryViewModel(data) : null), [data]);

  useEffect(() => {
    if (!story) {
      return;
    }

    const previousTitle = document.title;
    document.title = `${story.title} · 旅行故事`;
    return () => {
      document.title = previousTitle;
    };
  }, [story]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportLongImage = () => {
    if (!story) {
      return;
    }

    const width = 1200;
    const contentX = 96;
    const background = template === 'magazine' ? '#f8fafc' : '#fff7ed';
    const elements: string[] = [];
    let cursorY = 128;

    const escapeText = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const truncateText = (value: string, maxLength: number) =>
      value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

    const wrapText = (value: string, maxChars: number) => {
      const text = value.trim();
      if (!text) {
        return [''];
      }
      const lines: string[] = [];
      for (let index = 0; index < text.length; index += maxChars) {
        lines.push(text.slice(index, index + maxChars));
      }
      return lines;
    };

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
        `<text x="${input.x ?? contentX}" y="${input.y ?? cursorY}" fill="${input.fill ?? '#334155'}" font-size="${input.fontSize ?? 26}"${input.fontWeight ? ` font-weight="${input.fontWeight}"` : ''}${input.letterSpacing ? ` letter-spacing="${input.letterSpacing}"` : ''}>${escapeText(input.text)}</text>`,
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
        <image href="${escapeText(input.href)}" x="${input.x}" y="${input.y}" width="${input.width}" height="${input.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${input.clipId})" />
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
          .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeText(line)}</tspan>`)
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

    addSectionTitle('故事摘要', 'brief');
    story.highlights.forEach((item, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = contentX + column * 504;
      const y = cursorY + row * 118;
      elements.push(`<rect x="${x}" y="${y - 34}" width="456" height="92" rx="14" fill="#f8fafc" stroke="#e2e8f0" />`);
      addText({ text: item.label, x: x + 22, y: y, fill: '#64748b', fontSize: 22, fontWeight: 700 });
      addText({ text: item.value, x: x + 22, y: y + 40, fill: '#0f172a', fontSize: 34, fontWeight: 800 });
      addText({ text: truncateText(item.description, 18), x: x + 130, y: y + 40, fill: '#475569', fontSize: 22 });
    });
    cursorY += Math.ceil(story.highlights.length / 2) * 118 + 10;

    addSectionTitle('智能故事序言', 'narrative');
    addWrappedText({ text: story.smartNarrative, y: cursorY, fill: '#334155', fontSize: 28, maxChars: 35, lineHeight: 42 });

    addSectionTitle('路线摘录', 'route');
    if (story.routeStops.length === 0) {
      addWrappedText({ text: '暂无路线停靠点', y: cursorY, fill: '#64748b', fontSize: 28 });
    } else {
      story.routeStops.forEach((stop, index) => {
        const y = cursorY + index * 54;
        elements.push(`<circle cx="${contentX + 12}" cy="${y - 8}" r="8" fill="${escapeText(stop.companionColor)}" />`);
        addText({ text: `${stop.date} · ${stop.label} · ${stop.companionName}`, x: contentX + 38, y, fill: '#334155', fontSize: 26 });
      });
      cursorY += story.routeStops.length * 54 + 4;
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
    const photos = story.photoGroups.flatMap((group) =>
      group.photos.map((photo, index) => ({
        ...photo,
        displayIndex: index + 1,
        date: group.date,
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
        addClippedImage({
          href: photo.imageUrl,
          x,
          y,
          width: 304,
          height: 128,
          clipId: `trip-story-photo-${index}`,
        });
        elements.push(`<rect x="${x}" y="${y + 78}" width="304" height="50" rx="16" fill="rgba(15, 23, 42, 0.62)" />`);
        addText({ text: `PHOTO ${String(index + 1).padStart(2, '0')}`, x: x + 18, y: y + 104, fill: '#ffffff', fontSize: 18, fontWeight: 800 });
        addText({ text: truncateText(`${photo.date} · ${photo.markerTitle}`, 16), x: x + 120, y: y + 104, fill: '#e0f2fe', fontSize: 18, fontWeight: 700 });
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
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="${width}" height="${height}" fill="${background}" />
        <rect x="56" y="56" width="1088" height="${height - 112}" rx="28" fill="#ffffff" stroke="#dbe4ef" />
        ${elements.join('\n')}
      </svg>
    `;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${story.title}-旅行故事长图.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <RoutePageSkeleton variant="story" />;
  }

  return (
    <main className={`trip-story-stage trip-story-template-${template}`}>
      <div className="trip-story-shell">
        <section className="trip-story-hero">
          {story?.coverImageUrl ? (
            <img className="trip-story-hero-image" src={story.coverImageUrl} alt={`${story.title} 封面`} />
          ) : null}
          <div className="trip-story-hero-shade" />
          <div className="trip-story-hero-content">
            <span className="hero-kicker">Travel Story</span>
            <h1>{story?.title ?? '正在载入旅行故事...'}</h1>
            <p>{story ? story.lead : '正在把行程记录、照片、攻略和清单整理成一页可回看的旅行故事。'}</p>
            <div className="trip-story-hero-meta">
              <span>{story?.dateRange ?? 'Loading'}</span>
              <span>当前账号 {account.name}</span>
            </div>
            <div className="trip-story-actions">
              {story && !errorMessage ? (
                <>
                  <div className="trip-story-template-switch" aria-label="故事模板">
                    <button
                      type="button"
                      className={template === 'magazine' ? 'is-active' : undefined}
                      onClick={() => setTemplate('magazine')}
                    >
                      杂志风
                    </button>
                    <button
                      type="button"
                      className={template === 'memoir' ? 'is-active' : undefined}
                      onClick={() => setTemplate('memoir')}
                    >
                      纪念册
                    </button>
                  </div>
                  <button type="button" className="primary-button trip-story-print-button" onClick={handlePrint}>
                    导出 PDF / 打印
                  </button>
                  <button type="button" className="ghost-button" onClick={handleExportLongImage}>
                    导出长图
                  </button>
                </>
              ) : null}
              <button type="button" className="ghost-button" onClick={onNavigateBack}>
                返回行程详情
              </button>
              <button type="button" className="ghost-button trip-story-logout-button" onClick={() => void onLogout()}>
                退出登录
              </button>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <section className="card trip-detail-state-card trip-detail-state-card-error">
            <strong>{isTripDetailNotFoundError(errorMessage) ? '行程不存在或无权访问' : '旅行故事加载失败'}</strong>
            <p>{errorMessage}</p>
            <button type="button" className="ghost-button" onClick={onNavigateBack}>
              返回行程详情
            </button>
          </section>
        ) : null}

        {story ? (
          <>
            <section className="trip-story-intro card">
              <div>
                <span className="hero-kicker">Story Brief</span>
                <h2>这次旅行的故事骨架</h2>
                <p>{story.summaryText}</p>
                <p className="trip-story-smart-copy">{story.smartNarrative}</p>
              </div>
            </section>

            <section className="trip-story-highlight-grid" aria-label="旅行故事摘要">
              {story.highlights.map((highlight) => (
                <article key={highlight.label} className="card trip-story-highlight-card">
                  <span>{highlight.label}</span>
                  <strong>{highlight.value}</strong>
                  <p>{highlight.description}</p>
                </article>
              ))}
            </section>

            <section className="card trip-story-panel">
              <div className="trip-story-section-heading">
                <div>
                  <span className="hero-kicker">Route Film</span>
                  <h2>路线胶片</h2>
                </div>
                <p>按时间串起这次行程经过的地点，先用轻量只读方式呈现路线节奏。</p>
              </div>
              {story.routeStops.length === 0 ? (
                <div className="trip-story-empty">还没有可展示的路线停靠点。</div>
              ) : (
                <ol className="trip-story-route-film">
                  {story.routeStops.map((stop, index) => (
                    <li key={stop.key}>
                      <span className="trip-story-route-index">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <strong>{stop.label}</strong>
                        <p>{stop.date} · {stop.companionName}</p>
                      </div>
                      <span className="trip-story-route-dot" style={{ backgroundColor: stop.companionColor }} />
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="card trip-story-panel">
              <div className="trip-story-section-heading">
                <div>
                  <span className="hero-kicker">Timeline</span>
                  <h2>时间线叙事</h2>
                </div>
                <p>每一天保留原始游记，也把标签、天气、交通和预算这些轻量元数据带进故事。</p>
              </div>
              {story.timelineDays.length === 0 ? (
                <div className="trip-story-empty">这次行程还没有旅行记录。</div>
              ) : (
                <div className="trip-story-timeline">
                  {story.timelineDays.map((day) => (
                    <section key={day.date} className="trip-story-day">
                      <header>
                        <span>{day.date}</span>
                        <h3>{day.title}</h3>
                      </header>
                      <div className="trip-story-marker-list">
                        {day.markers.map((marker) => (
                          <article key={marker.id} className="trip-story-marker-card">
                            <div className="trip-story-marker-head">
                              <div>
                                <strong>{marker.scopeName} · {marker.city}</strong>
                                <p>{marker.displayRange} · {marker.companionName}</p>
                              </div>
                              <span style={{ backgroundColor: marker.companionColor }} />
                            </div>
                            <p>{marker.note || '这条记录还没有补充游记。'}</p>
                            {marker.metadataLabels.length > 0 ? (
                              <div className="trip-story-chip-row">
                                {marker.metadataLabels.map((label) => (
                                  <span key={label}>{label}</span>
                                ))}
                              </div>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </section>

            <section className="trip-story-two-column">
              <section className="card trip-story-panel">
                <div className="trip-story-section-heading">
                  <div>
                    <span className="hero-kicker">Photos</span>
                    <h2>照片段落</h2>
                  </div>
                </div>
                {story.photoGroups.length === 0 ? (
                  <div className="trip-story-empty">这次旅行还没有照片，后续补图后故事页会自动展示。</div>
                ) : (
                  <div className="trip-story-photo-stack">
                    {story.photoGroups.map((group) => (
                      <section key={group.date}>
                        <strong>{group.date}</strong>
                        <div className="trip-story-photo-grid">
                          {group.photos.map((photo) => (
                            <figure key={`${photo.markerId}-${photo.imageUrl}`}>
                              <img src={photo.imageUrl} alt={`${photo.markerTitle} ${photo.visitedStartAt}`} loading="lazy" />
                              <figcaption>{photo.markerTitle}</figcaption>
                            </figure>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </section>

              <section className="card trip-story-panel">
                <div className="trip-story-section-heading">
                  <div>
                    <span className="hero-kicker">Guides</span>
                    <h2>攻略摘录</h2>
                  </div>
                </div>
                {story.guides.length === 0 ? (
                  <div className="trip-story-empty">这次行程还没有关联攻略。</div>
                ) : (
                  <div className="trip-story-guide-list">
                    {story.guides.map((guide) => (
                      <article key={guide.id} className="trip-story-guide-card">
                        <span>{guide.result.sourceName}</span>
                        <h3>{guide.result.title}</h3>
                        <p>{guide.result.summary}</p>
                        {/^https?:\/\//.test(guide.result.sourceUrl) ? (
                          <a href={guide.result.sourceUrl} target="_blank" rel="noreferrer">
                            查看原文
                          </a>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </section>

            <section className="card trip-story-panel">
              <div className="trip-story-section-heading">
                <div>
                  <span className="hero-kicker">Checklist Review</span>
                  <h2>行前清单回顾</h2>
                </div>
                <p>{story.checklistReview.completionText}</p>
              </div>
              {story.checklistReview.total === 0 ? (
                <div className="trip-story-empty">这次行程还没有清单事项。</div>
              ) : (
                <div className="trip-story-checklist-grid">
                  {story.checklistReview.groups.map((group) => (
                    <article key={group.stage} className="trip-story-checklist-card">
                      <span>{group.readableStage}</span>
                      <strong>{group.itemCount}</strong>
                      <p>{group.title}</p>
                      <ul>
                        {group.items.slice(0, 3).map((item) => (
                          <li key={item.id}>{item.title}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
