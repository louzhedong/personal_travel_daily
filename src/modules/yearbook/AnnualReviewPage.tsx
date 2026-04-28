import { useEffect, useMemo, useState } from 'react';
import StatsHeatmapPanel from '../../components/stats/StatsHeatmapPanel';
import RoutePageSkeleton from '../../components/ui/RoutePageSkeleton';
import { fetchAnnualReview } from '../../lib/api/statsApi';
import type { AnnualReviewResponseDto } from '../../lib/api/types';
import type { AuthAccount } from '../../types';
import {
  buildAnnualHighlightItems,
  buildAnnualSummaryCards,
  buildMarkerCaption,
  formatAnnualReviewDate,
  formatAnnualReviewDateRange,
  formatAnnualReviewMonth,
} from './annualReviewPageModel';

interface AnnualReviewPageProps {
  account: AuthAccount;
  year: string;
  onNavigateBack: () => void;
  onOpenTripDetail: (tripId: string) => void;
  onLogout: () => Promise<void> | void;
}

export default function AnnualReviewPage({
  account,
  year,
  onNavigateBack,
  onOpenTripDetail,
  onLogout,
}: AnnualReviewPageProps) {
  const [data, setData] = useState<AnnualReviewResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchAnnualReview(year)
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
        setErrorMessage(error instanceof Error ? error.message : '年度回顾加载失败');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [year]);

  const summaryCards = useMemo(() => (data ? buildAnnualSummaryCards(data) : []), [data]);
  const highlights = useMemo(() => (data ? buildAnnualHighlightItems(data) : []), [data]);
  const isEmpty = !!data && data.summary.totalMarkers === 0;
  const coverPhotos = data?.photos.length ? data.photos.slice(0, 5) : data?.representativePhoto ? [data.representativePhoto] : [];

  useEffect(() => {
    setActivePhotoIndex(0);
  }, [year, coverPhotos.length]);

  useEffect(() => {
    if (coverPhotos.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActivePhotoIndex((current) => (current + 1) % coverPhotos.length);
    }, 3600);

    return () => window.clearInterval(timer);
  }, [coverPhotos.length]);

  const getCoverSlideClassName = (index: number) => {
    if (index === activePhotoIndex) {
      return 'is-active';
    }
    if (index === (activePhotoIndex - 1 + coverPhotos.length) % coverPhotos.length) {
      return 'is-prev';
    }
    if (index === (activePhotoIndex + 1) % coverPhotos.length) {
      return 'is-next';
    }
    return 'is-hidden';
  };

  if (loading) {
    return <RoutePageSkeleton variant="story" />;
  }

  return (
    <main className="annual-review-stage">
      <div className="annual-review-shell">
        <section className="annual-review-hero">
          <div className="annual-review-hero-copy">
            <span className="hero-kicker">Travel Yearbook</span>
            <h1>{year} 年度旅行回顾</h1>
            <p>
              {data && !isEmpty
                ? `${account.name} 在这一年留下了 ${data.summary.totalMarkers} 条旅行记录，覆盖 ${data.summary.totalCities} 座城市。`
                : '把这一年的旅行记录、照片、攻略和同行记忆整理成一页私有年鉴。'}
            </p>
            <div className="annual-review-actions">
              <button type="button" className="ghost-button" onClick={onNavigateBack}>
                返回统计中心
              </button>
              <button type="button" className="ghost-button" onClick={() => void onLogout()}>
                退出登录
              </button>
            </div>
          </div>
          {coverPhotos.length > 0 ? (
            <div className="annual-review-cover annual-review-carousel" aria-label={`${year} 年度照片轮播`}>
              <div className="annual-review-carousel-track">
                {coverPhotos.map((photo, index) => (
                  <figure
                    key={`${photo.markerId}-${photo.imageUrl}`}
                    className={`annual-review-carousel-slide ${getCoverSlideClassName(index)}`}
                  >
                    <img src={photo.imageUrl} alt={`${year} 年度照片 ${index + 1}`} />
                    <figcaption>
                      <strong>{photo.markerTitle}</strong>
                      <span>{formatAnnualReviewDate(photo.visitedStartAt)}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
              {coverPhotos.length > 1 ? (
                <div className="annual-review-carousel-dots" aria-hidden="true">
                  {coverPhotos.map((photo, index) => (
                    <span
                      key={`${photo.markerId}-${index}`}
                      className={index === activePhotoIndex ? 'is-active' : undefined}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <aside className="annual-review-cover annual-review-cover-empty">
              <strong>{year}</strong>
              <span>暂无年度代表照片</span>
            </aside>
          )}
        </section>

        {errorMessage ? (
          <section className="card annual-review-state annual-review-state-error">
            <strong>年度回顾加载失败</strong>
            <p>{errorMessage}</p>
            <button type="button" className="ghost-button" onClick={onNavigateBack}>
              返回统计中心
            </button>
          </section>
        ) : null}

        {data ? (
          isEmpty ? (
            <section className="card annual-review-empty">
              <strong>{year} 年还没有旅行记录</strong>
              <p>回到统计中心切换到其他年份，或者先在旅行主页记录一次新的出发。</p>
              <button type="button" className="ghost-button" onClick={onNavigateBack}>
                返回统计中心
              </button>
            </section>
          ) : (
            <>
              <section className="annual-review-summary-grid">
                {summaryCards.map((card) => (
                  <article key={card.label} className="card annual-review-summary-card">
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                    <p>{card.description}</p>
                  </article>
                ))}
              </section>

              <section className="annual-review-two-column">
                <section className="card annual-review-panel">
                  <div className="annual-review-heading">
                    <div>
                      <h2>年度亮点</h2>
                      <p>用几条最容易记住的线索，快速翻回这一年的旅行状态。</p>
                    </div>
                  </div>
                  <div className="annual-review-highlight-grid">
                    {highlights.map((item) => (
                      <article key={item.label} className="annual-review-highlight-card">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                        <p>{item.description}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="card annual-review-panel">
                  <div className="annual-review-heading">
                    <div>
                      <h2>首末足迹</h2>
                      <p>这一年从哪里开始，又在哪里收尾。</p>
                    </div>
                  </div>
                  <div className="annual-review-marker-pair">
                    <article>
                      <span>第一条记录</span>
                      <strong>{data.firstMarker ? `${data.firstMarker.scopeName} · ${data.firstMarker.city}` : '暂无记录'}</strong>
                      <p>{buildMarkerCaption(data.firstMarker)}</p>
                    </article>
                    <article>
                      <span>最后一条记录</span>
                      <strong>{data.lastMarker ? `${data.lastMarker.scopeName} · ${data.lastMarker.city}` : '暂无记录'}</strong>
                      <p>{buildMarkerCaption(data.lastMarker)}</p>
                    </article>
                  </div>
                </section>
              </section>

              <section className="card annual-review-panel">
                <div className="annual-review-heading">
                  <div>
                    <h2>月度节奏</h2>
                    <p>12 个月里，旅行记录和旅行天数如何分布。</p>
                  </div>
                </div>
                <div className="annual-review-month-grid">
                  {data.monthlyDistribution.map((item) => (
                    <article key={item.month} className="annual-review-month-card">
                      <span>{formatAnnualReviewMonth(item.month)}</span>
                      <strong>{item.markerCount}</strong>
                      <p>{item.travelDays} 天</p>
                      <div className="annual-review-month-track">
                        <div style={{ height: `${Math.max(8, Math.min(100, item.travelDays * 12))}%` }} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <StatsHeatmapPanel scope="all" heatmap={data.heatmap} />

              <section className="card annual-review-panel">
                <div className="annual-review-heading">
                  <div>
                    <h2>年度照片墙</h2>
                    <p>按时间选取最多 12 张代表照片。</p>
                  </div>
                </div>
                <div className="annual-review-photo-grid">
                  {data.photos.map((photo) => (
                    <figure key={`${photo.markerId}-${photo.imageUrl}`} className="annual-review-photo-card">
                      <img src={photo.imageUrl} alt={photo.markerTitle} loading="lazy" />
                      <figcaption>
                        <strong>{photo.markerTitle}</strong>
                        <span>{formatAnnualReviewDate(photo.visitedStartAt)}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>

              <section className="annual-review-two-column">
                <section className="card annual-review-panel annual-review-panel-fixed">
                  <div className="annual-review-heading">
                    <div>
                      <h2>年度行程</h2>
                      <p>继续钻取到单次行程详情。</p>
                    </div>
                  </div>
                  <div className="annual-review-trip-list">
                    {data.trips.map((trip) => (
                      <button key={trip.tripId} type="button" onClick={() => onOpenTripDetail(trip.tripId)}>
                        <strong>{trip.tripName}</strong>
                        <span>{formatAnnualReviewDateRange(trip.startsAt, trip.endsAt)}</span>
                        <p>
                          {trip.markerCount} 条记录 · {trip.travelDays} 天
                        </p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="card annual-review-panel annual-review-panel-fixed">
                  <div className="annual-review-heading">
                    <div>
                      <h2>关联攻略</h2>
                      <p>这一年收藏并关联到足迹的攻略素材。</p>
                    </div>
                  </div>
                  <div className="annual-review-guide-list">
                    {data.guides.map((guide) => (
                      <article key={guide.id} className="annual-review-guide-card">
                        <strong>{guide.title}</strong>
                        <p>{guide.summary}</p>
                        <span>{guide.keyword} · {guide.sourceName}</span>
                      </article>
                    ))}
                  </div>
                </section>
              </section>
            </>
          )
        ) : null}
      </div>
    </main>
  );
}
