import { useEffect, useMemo, useState } from 'react';
import { fetchPhotoCuration, updatePhotoCuration } from '../../lib/api/photoCurationApi';
import type {
  PhotoCurationCaptionFilterDto,
  PhotoCurationFeaturedFilterDto,
  PhotoCurationItemDto,
  PhotoCurationQuery,
  PhotoCurationResponseDto,
} from '../../lib/api/types';
import type { AuthAccount } from '../../types';
import { FancySelect } from '../../components/ui/FancySelect';
import AppToast, { type AppToastTone } from '../../components/ui/AppToast';
import RoutePageSkeleton from '../../components/ui/RoutePageSkeleton';
import {
  PHOTO_CAPTION_FILTER_OPTIONS,
  PHOTO_FEATURED_FILTER_OPTIONS,
  buildPhotoCurationAlt,
  formatPhotoDate,
  getHeroPhotos,
  getPhotoCurationEmptyText,
  getWorklistPhotos,
} from './photoCurationPageModel';

interface PhotoCurationPageProps {
  account: AuthAccount;
  initialQuery?: PhotoCurationQuery;
  onLogout: () => Promise<void> | void;
  onNavigateBack: () => void;
}

function buildQueryState(query?: PhotoCurationQuery): Required<Pick<PhotoCurationQuery, 'featured' | 'caption'>> & PhotoCurationQuery {
  return {
    tripId: query?.tripId,
    companionId: query?.companionId,
    year: query?.year,
    featured: query?.featured ?? 'all',
    caption: query?.caption ?? 'all',
    limit: query?.limit ?? 120,
  };
}

function PhotoCard({
  photo,
  busy,
  onToggleFeatured,
  onUpdateCaption,
}: {
  photo: PhotoCurationItemDto;
  busy: boolean;
  onToggleFeatured: (photo: PhotoCurationItemDto) => void;
  onUpdateCaption: (photo: PhotoCurationItemDto, caption: string) => void;
}) {
  const [caption, setCaption] = useState(photo.caption ?? '');

  useEffect(() => {
    setCaption(photo.caption ?? '');
  }, [photo.caption, photo.imageId]);

  return (
    <article className="photo-curation-card">
      <img src={photo.imageUrl} alt={buildPhotoCurationAlt(photo)} loading="lazy" />
      <div className="photo-curation-card-body">
        <div>
          <strong>{photo.caption || photo.markerTitle}</strong>
          <p>
            {photo.scopeName} · {photo.city} · {formatPhotoDate(photo.visitedStartAt)}
          </p>
          <span className="photo-curation-trip">{photo.tripName ?? '未归入行程'}</span>
        </div>
        <label className="photo-curation-caption-field">
          <span>照片说明</span>
          <input
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            onBlur={() => onUpdateCaption(photo, caption)}
            placeholder="补一句可以被故事复用的话"
            disabled={busy}
          />
        </label>
        <div className="photo-curation-card-actions">
          <span className="photo-curation-companion">
            <i style={{ backgroundColor: photo.companionColor }} aria-hidden="true" />
            {photo.companionName}
          </span>
          <button type="button" className="ghost-button" disabled={busy} onClick={() => onToggleFeatured(photo)}>
            {photo.isFeatured ? '取消精选' : '设为精选'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function PhotoCurationPage({
  account,
  initialQuery,
  onLogout,
  onNavigateBack,
}: PhotoCurationPageProps) {
  const [data, setData] = useState<PhotoCurationResponseDto | null>(null);
  const [query, setQuery] = useState(() => buildQueryState(initialQuery));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: AppToastTone } | null>(null);

  const showToast = (message: string, tone: AppToastTone = 'info') => {
    setToast({ message, tone });
  };

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchPhotoCuration(query)
      .then((response) => {
        if (!cancelled) {
          setData(response);
          setErrorMessage('');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : '影像编辑台加载失败');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const heroPhotos = useMemo(() => (data ? getHeroPhotos(data) : []), [data]);
  const worklistPhotos = useMemo(() => (data ? getWorklistPhotos(data) : []), [data]);

  const applyCuration = async (
    photo: PhotoCurationItemDto,
    input: { isFeatured?: boolean; caption?: string | null },
    successMessage: string,
  ) => {
    setBusy(true);
    try {
      const response = await updatePhotoCuration(
        {
          items: [
            {
              imageId: photo.imageId,
              ...input,
            },
          ],
        },
        query,
      );
      setData(response);
      showToast(successMessage, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '照片整理失败', 'error');
    } finally {
      setBusy(false);
    }
  };

  const updateQuery = (patch: Partial<PhotoCurationQuery>) => {
    setQuery((current) => ({
      ...current,
      ...patch,
    }));
  };

  if (loading && !data) {
    return <RoutePageSkeleton variant="detail" />;
  }

  return (
    <main className="photo-curation-shell">
      <header className="photo-curation-topbar">
        <button type="button" className="ghost-button" onClick={onNavigateBack}>
          返回
        </button>
        <div>
          <span>当前账号：{account.name}</span>
          <button type="button" className="ghost-button" onClick={() => void onLogout()}>
            退出登录
          </button>
        </div>
      </header>

      <section className="photo-curation-hero">
        <div className="photo-curation-hero-copy">
          <span className="hero-kicker">PHOTO DESK</span>
          <h1>影像编辑台</h1>
          <p>把旅行照片整理成可以被故事、年鉴和回忆继续使用的素材。</p>
          {data ? (
            <div className="photo-curation-summary">
              <span><strong>{data.summary.totalPhotos}</strong> 全部照片</span>
              <span><strong>{data.summary.featuredPhotos}</strong> 已精选</span>
              <span><strong>{data.summary.missingCaptionPhotos}</strong> 待补说明</span>
            </div>
          ) : null}
        </div>
        {heroPhotos.length > 0 ? (
          <div className="photo-curation-hero-spread">
            {heroPhotos.map((photo) => (
              <figure key={photo.imageId}>
                <img src={photo.imageUrl} alt={buildPhotoCurationAlt(photo)} />
              </figure>
            ))}
          </div>
        ) : null}
      </section>

      {errorMessage ? <section className="photo-curation-error">{errorMessage}</section> : null}

      {data ? (
        <>
          <section className="photo-curation-filters" aria-label="影像筛选">
            <FancySelect
              value={query.tripId ?? 'all'}
              placeholder="选择行程"
              ariaLabel="选择行程"
              options={[
                { value: 'all', label: '全部行程' },
                ...data.filters.trips.map((trip) => ({
                  value: trip.id,
                  label: `${trip.name} · ${trip.photoCount} 张`,
                })),
              ]}
              onChange={(value) => updateQuery({ tripId: value === 'all' ? undefined : value })}
            />
            <FancySelect
              value={query.companionId ?? 'all'}
              placeholder="选择旅伴"
              ariaLabel="选择旅伴"
              options={[
                { value: 'all', label: '全部旅伴' },
                ...data.filters.companions.map((companion) => ({
                  value: companion.id,
                  label: `${companion.name} · ${companion.photoCount} 张`,
                })),
              ]}
              onChange={(value) => updateQuery({ companionId: value === 'all' ? undefined : value })}
            />
            <FancySelect
              value={query.year ? String(query.year) : 'all'}
              placeholder="选择年份"
              ariaLabel="选择年份"
              options={[
                { value: 'all', label: '全部年份' },
                ...data.filters.years.map((year) => ({
                  value: String(year.year),
                  label: `${year.year} · ${year.photoCount} 张`,
                })),
              ]}
              onChange={(value) => updateQuery({ year: value === 'all' ? undefined : Number(value) })}
            />
            <FancySelect
              value={query.featured}
              placeholder="精选状态"
              ariaLabel="精选状态"
              options={PHOTO_FEATURED_FILTER_OPTIONS}
              onChange={(value) => updateQuery({ featured: value as PhotoCurationFeaturedFilterDto })}
            />
            <FancySelect
              value={query.caption}
              placeholder="说明状态"
              ariaLabel="说明状态"
              options={PHOTO_CAPTION_FILTER_OPTIONS}
              onChange={(value) => updateQuery({ caption: value as PhotoCurationCaptionFilterDto })}
            />
          </section>

          <section className="photo-curation-workspace">
            <div className="photo-curation-featured">
              <div className="photo-curation-section-head">
                <h2>精选预览</h2>
                <span>{data.sections.featured.length || data.sections.recent.length} 张</span>
              </div>
              {heroPhotos.length === 0 ? (
                <div className="photo-curation-empty">{getPhotoCurationEmptyText()}</div>
              ) : (
                <div className="photo-curation-featured-grid">
                  {heroPhotos.map((photo) => (
                    <figure key={photo.imageId}>
                      <img src={photo.imageUrl} alt={buildPhotoCurationAlt(photo)} />
                      <figcaption>{photo.caption || photo.markerTitle}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </div>

            <div className="photo-curation-worklist">
              <div className="photo-curation-section-head">
                <h2>待整理</h2>
                <span>{worklistPhotos.length} 张</span>
              </div>
              {worklistPhotos.length === 0 ? (
                <div className="photo-curation-empty">已整理完成</div>
              ) : (
                <div className="photo-curation-card-list">
                  {worklistPhotos.map((photo) => (
                    <PhotoCard
                      key={photo.imageId}
                      photo={photo}
                      busy={busy}
                      onToggleFeatured={(target) =>
                        void applyCuration(
                          target,
                          { isFeatured: !target.isFeatured },
                          target.isFeatured ? '已取消精选照片' : '已设为精选照片',
                        )
                      }
                      onUpdateCaption={(target, caption) => {
                        const nextCaption = caption.trim();
                        if ((target.caption ?? '') === nextCaption) {
                          return;
                        }
                        void applyCuration(
                          target,
                          { caption: nextCaption || null },
                          nextCaption ? '已更新照片说明' : '已清空照片说明',
                        );
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}

      <AppToast open={!!toast} message={toast?.message ?? ''} tone={toast?.tone} />
    </main>
  );
}
