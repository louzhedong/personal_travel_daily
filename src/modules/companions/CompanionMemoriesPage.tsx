import { useEffect, useMemo, useState } from 'react';
import AppToast, { type AppToastTone } from '../../components/ui/AppToast';
import RoutePageSkeleton from '../../components/ui/RoutePageSkeleton';
import TravelIcon from '../../components/ui/TravelIcon';
import { fetchCompanionMemory, refreshCompanionMemory } from '../../lib/api/companionMemoriesApi';
import type { AuthAccount } from '../../types';
import type { CompanionMemoryResponseDto } from '../../lib/api/types';
import {
  buildYearMemorySummary,
  buildPhotoAlt,
  formatMemoryDate,
  formatMemoryDateTime,
  getEmptySectionText,
  getPeakYear,
} from './companionMemoriesPageModel';

interface CompanionMemoriesPageProps {
  account: AuthAccount;
  companionId: string;
  onNavigateBack: () => void;
  onOpenMemoryCapsules?: () => void;
  onLogout: () => Promise<void> | void;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="companion-memory-section-head">
      <h2>{title}</h2>
    </div>
  );
}

function EmptyBlock({ children }: { children: string }) {
  return <div className="companion-memory-empty">{children}</div>;
}

export default function CompanionMemoriesPage({
  account: _account,
  companionId,
  onNavigateBack,
  onOpenMemoryCapsules,
  onLogout,
}: CompanionMemoriesPageProps) {
  const [data, setData] = useState<CompanionMemoryResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: AppToastTone } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCompanionMemory(companionId)
      .then((response) => {
        if (!cancelled) {
          setData(response);
          setErrorMessage('');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setData(null);
          setErrorMessage(error instanceof Error ? error.message : '共同回忆加载失败');
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
  }, [companionId]);

  const showToast = (message: string, tone: AppToastTone = 'info') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 2600);
  };

  const peakYear = useMemo(() => getPeakYear(data?.yearlySeries ?? []), [data]);
  const latestYear = data?.yearlySeries[data.yearlySeries.length - 1]?.year;
  const representativeTrips = data?.trips.slice(0, 3) ?? [];
  const featuredTrip = representativeTrips[0] ?? null;
  const supportingTrips = representativeTrips.slice(1);
  const photoSpread = data?.photos.slice(0, 5) ?? [];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await refreshCompanionMemory(companionId);
      setData(response);
      setErrorMessage('');
      showToast('共同回忆已重新整理。', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '共同回忆刷新失败', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <RoutePageSkeleton variant="detail" />;
  }

  if (!data) {
    return (
      <main className="companion-memory-shell companion-memory-state-shell">
        <section className="card companion-memory-state-card">
          <h1>共同回忆暂时没有打开</h1>
          <p>{errorMessage || '这位旅伴的共同回忆加载失败，可以稍后再试。'}</p>
          <div className="companion-memory-actions">
            <button type="button" className="ghost-button" onClick={onNavigateBack}>
              返回上一页
            </button>
            <button type="button" className="primary-button" onClick={() => window.location.reload()}>
              重新加载
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="companion-memory-shell">
      <header className="companion-memory-topbar">
        <button type="button" className="ghost-button" onClick={onNavigateBack}>
          返回首页
        </button>
        <div className="companion-memory-topbar-actions">
          <button type="button" className="primary-button" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? '正在整理...' : '刷新回忆'}
          </button>
          <button type="button" className="ghost-button" onClick={onOpenMemoryCapsules} disabled={!onOpenMemoryCapsules}>
            创建胶囊
          </button>
          <button type="button" className="ghost-button" onClick={onLogout}>
            退出登录
          </button>
        </div>
      </header>

      <section className="companion-memory-hero">
        <div className="companion-memory-hero-copy">
          <h1>
            <span>和 {data.companion.name}</span>
            <span>的共同回忆</span>
          </h1>
          <p>{data.summary.headline}</p>
          <p className="companion-memory-inline-stats">
            <strong>{data.summary.markerCount}</strong> 段记录
            <span>/</span>
            <strong>{data.summary.travelDays}</strong> 天同行
            <span>/</span>
            <strong>{data.summary.photoCount}</strong> 张照片
          </p>
          <span className="companion-memory-updated">最近整理于 {formatMemoryDateTime(data.snapshot.generatedAt)}</span>
        </div>
        <aside className="companion-memory-hero-note">
          <TravelIcon name="spark" size={30} />
          <strong>{formatMemoryDate(data.summary.firstSharedAt)}</strong>
          <span>第一段同行记忆</span>
        </aside>
      </section>

      <section className="companion-memory-section companion-memory-year-section">
        <SectionHeader title="这些年一起留下的记忆" />
        {data.yearlySeries.length === 0 ? (
          <EmptyBlock>{getEmptySectionText('years')}</EmptyBlock>
        ) : (
          <div className="companion-memory-year-list">
            {data.yearlySeries.map((item) => {
              const isPeak = item.year === peakYear;
              const isLatest = item.year === latestYear;
              return (
                <article key={item.year} className="companion-memory-year-row">
                  <div className="companion-memory-year-row-head">
                    <span className="companion-memory-year-label">{item.year}</span>
                    {isPeak ? <em className="companion-memory-year-card-badge">最密集</em> : null}
                  </div>
                  <div className="companion-memory-year-row-main">
                    <strong>{item.markerCount}</strong>
                    <span>段共同记录</span>
                  </div>
                  <p className="companion-memory-year-row-meta">
                    {item.travelDays} 天同行 / {item.photoCount} 张照片
                  </p>
                  <p>{buildYearMemorySummary(item, { isPeak, isLatest })}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="companion-memory-section companion-memory-trip-section">
        <SectionHeader title="最代表你们的 3 次同行" />
        {representativeTrips.length === 0 ? (
          <EmptyBlock>{getEmptySectionText('trips')}</EmptyBlock>
        ) : (
          <div className="companion-memory-featured-layout">
            {featuredTrip ? (
              <article className="companion-memory-featured-lead">
                {featuredTrip.coverImageUrl ? (
                  <img src={featuredTrip.coverImageUrl} alt={`${featuredTrip.tripName} 封面`} />
                ) : (
                  <div className="companion-memory-trip-cover-fallback" />
                )}
                <div className="companion-memory-featured-copy">
                  <strong>{featuredTrip.tripName}</strong>
                  <span>{formatMemoryDate(featuredTrip.startsAt)} - {formatMemoryDate(featuredTrip.endsAt)}</span>
                  <small>{featuredTrip.markerCount} 条记录 · {featuredTrip.photoCount} 张照片</small>
                </div>
              </article>
            ) : null}
            {supportingTrips.length > 0 ? (
              <div className="companion-memory-featured-list">
                {supportingTrips.map((trip) => (
                  <article key={trip.tripId} className="companion-memory-featured-item">
                    <strong>{trip.tripName}</strong>
                    <span>{formatMemoryDate(trip.startsAt)} - {formatMemoryDate(trip.endsAt)}</span>
                    <small>{trip.markerCount} 条记录 · {trip.photoCount} 张照片</small>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>

      <div className="companion-memory-editorial-spread">
        <aside className="companion-memory-notes">
          <section className="companion-memory-note-section">
            <SectionHeader title="一起去过的地方" />
            {data.topCities.length === 0 ? (
              <EmptyBlock>{getEmptySectionText('places')}</EmptyBlock>
            ) : (
              <div className="companion-memory-place-list">
                {data.topCities.slice(0, 6).map((city) => (
                  <article key={`${city.scope}-${city.scopeId}-${city.city}`} className="companion-memory-place-row">
                    <div>
                      <strong>{city.city}</strong>
                      <span>{city.scopeName}</span>
                    </div>
                    <em>{city.markerCount} 段</em>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="companion-memory-note-section">
            <SectionHeader title="共同主题" />
            {data.themes.length === 0 ? (
              <EmptyBlock>{getEmptySectionText('themes')}</EmptyBlock>
            ) : (
              <p className="companion-memory-inline-list">
                {data.themes.map((theme) => theme.label).join(' / ')}
              </p>
            )}
          </section>

          <section className="companion-memory-note-section">
            <SectionHeader title="共同攻略" />
            {data.guides.length === 0 ? (
              <EmptyBlock>{getEmptySectionText('guides')}</EmptyBlock>
            ) : (
              <div className="companion-memory-guide-list">
                {data.guides.map((guide) => (
                  <a key={guide.id} className="companion-memory-guide-row" href={guide.sourceUrl} target="_blank" rel="noreferrer">
                    <span>{guide.sourceName}</span>
                    <strong>{guide.title}</strong>
                  </a>
                ))}
              </div>
            )}
          </section>
        </aside>

        <div className="companion-memory-body">
          <section className="companion-memory-section companion-memory-photo-section">
            <SectionHeader title="照片" />
            {photoSpread.length === 0 ? (
              <EmptyBlock>{getEmptySectionText('photos')}</EmptyBlock>
            ) : (
              <div className="companion-memory-photo-grid">
                {photoSpread.map((photo, index) => (
                  <figure key={photo.imageId} className="companion-memory-photo-card">
                    <img src={photo.imageUrl} alt={buildPhotoAlt(photo, data.companion.name)} />
                    <figcaption>
                      <strong>{photo.caption || photo.markerTitle}</strong>
                      <span>{formatMemoryDate(photo.visitedStartAt)}</span>
                    </figcaption>
                    {index === 0 ? <span className="companion-memory-photo-kicker">精选</span> : null}
                  </figure>
                ))}
              </div>
            )}
          </section>

          <section className="companion-memory-section companion-memory-timeline-section">
            <SectionHeader title="记忆节点" />
            <div className="companion-memory-milestone-timeline">
              {data.milestones.map((milestone) => (
                <article key={milestone.id} className="companion-memory-milestone-item">
                  <span className="companion-memory-milestone-dot" aria-hidden="true" />
                  <div className="companion-memory-milestone-content">
                    <span>{milestone.happenedAt ? formatMemoryDate(milestone.happenedAt) : '待开启'}</span>
                    <strong>{milestone.title}</strong>
                    <p>{milestone.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      <AppToast open={!!toast} message={toast?.message ?? ''} tone={toast?.tone} />
    </main>
  );
}
