import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthAccount } from '../../types';
import { queryRecallEvents, rebuildRecallIndex } from '../../lib/api/recallApi';
import type {
  RecallEventDto,
  RecallEventKindDto,
  RecallFacetCountDto,
  RecallQueryFiltersDto,
  RecallQueryResponseDto,
} from '../../lib/api/dto/recall';

/**
 * G3 · RecallPage / 事件维度回想页面
 * Multi-facet filter on companions / weather / mood / tag / city / kind / date.
 */
interface Props {
  account: AuthAccount;
  onLogout: () => Promise<void> | void;
  onNavigateBack: () => void;
}

const KIND_LABELS: Record<RecallEventKindDto, string> = {
  marker: '足迹',
  photo: '照片',
  expense: '账单',
  journal: '日记',
  guide: '攻略',
};

function toggleArray<T>(arr: T[] | undefined, value: T): T[] {
  const set = new Set(arr ?? []);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return Array.from(set);
}

export default function RecallPage({ account, onLogout, onNavigateBack }: Props) {
  const [filters, setFilters] = useState<RecallQueryFiltersDto>({ limit: 200 });
  const [data, setData] = useState<RecallQueryResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runQuery = useCallback(async (next: RecallQueryFiltersDto) => {
    setLoading(true);
    try {
      const response = await queryRecallEvents(next);
      setData(response);
      setError(null);
    } catch {
      setError('回想索引查询失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runQuery(filters);
  }, [filters, runQuery]);

  const handleRebuild = async () => {
    setBusy(true);
    try {
      await rebuildRecallIndex();
      await runQuery(filters);
    } finally {
      setBusy(false);
    }
  };

  const renderFacetChips = (
    title: string,
    field: keyof RecallQueryFiltersDto,
    facets: RecallFacetCountDto[],
  ) => {
    const selected = (filters[field] as string[] | undefined) ?? [];
    return (
      <div style={{ marginBottom: 12 }}>
        <small>{title}</small>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {facets.map((facet) => {
            const active = selected.includes(facet.value);
            return (
              <button
                key={facet.value}
                className="ghost-button"
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: active ? 'var(--accent-soft, #e9eef5)' : undefined,
                }}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    [field]: toggleArray(current[field] as string[] | undefined, facet.value),
                  }))
                }
              >
                {facet.label} · {facet.count}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const groupedEvents = useMemo(() => {
    const map = new Map<string, RecallEventDto[]>();
    (data?.events ?? []).forEach((event) => {
      const key = event.eventDate.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [data]);

  return (
    <main className="recall-shell">
      <div className="journey-topbar">
        <button className="ghost-button" onClick={onNavigateBack}>返回</button>
        <button className="ghost-button" onClick={() => void onLogout()}>退出登录</button>
      </div>
      <section className="card">
        <span className="hero-kicker">Event Recall · @{account.username}</span>
        <h1>事件维度回想</h1>
        <p>不再翻照片墙——按同伴、天气、心情、标签、城市筛出共同的瞬间。</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="ghost-button" disabled={busy} onClick={() => void handleRebuild()}>重建索引</button>
          <button className="ghost-button" onClick={() => setFilters({ limit: 200 })}>清空筛选</button>
        </div>
      </section>

      {error ? <section className="card"><p>{error}</p></section> : null}

      <section className="card">
        <h3>筛选 · {data?.total ?? 0} 条事件</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <input
            className="field-control"
            placeholder="开始日期 YYYY-MM-DD"
            value={filters.startDate ?? ''}
            onChange={(e) => setFilters((c) => ({ ...c, startDate: e.target.value || undefined }))}
          />
          <input
            className="field-control"
            placeholder="结束日期 YYYY-MM-DD"
            value={filters.endDate ?? ''}
            onChange={(e) => setFilters((c) => ({ ...c, endDate: e.target.value || undefined }))}
          />
        </div>
        <input
          className="field-control"
          placeholder="关键词搜索（标题 / 城市 / 旅行）"
          value={filters.searchKeyword ?? ''}
          onChange={(e) => setFilters((c) => ({ ...c, searchKeyword: e.target.value || undefined }))}
        />
        {data ? (
          <div style={{ marginTop: 12 }}>
            {renderFacetChips('同伴', 'companionIds', data.facets.companions)}
            {renderFacetChips('心情', 'moods', data.facets.moods)}
            {renderFacetChips('天气', 'weathers', data.facets.weathers)}
            {renderFacetChips('城市', 'cities', data.facets.cities)}
            {renderFacetChips('标签', 'tagSlugs', data.facets.tags)}
          </div>
        ) : null}
      </section>

      <section className="card" aria-busy={loading}>
        <h3>事件流</h3>
        {loading ? <p>加载中…</p> : null}
        {!loading && groupedEvents.length === 0 ? <p>没有匹配的事件，换组筛选试试。</p> : null}
        {groupedEvents.map(([month, events]) => (
          <div key={month} style={{ marginTop: 16 }}>
            <h4>{month}</h4>
            <ul style={{ display: 'grid', gap: 6 }}>
              {events.map((event) => (
                <li key={event.id} className="panel-card" style={{ padding: 10 }}>
                  <small>{event.eventDate} · {KIND_LABELS[event.kind]}{event.tripName ? ` · ${event.tripName}` : ''}</small>
                  <div><strong>{event.title ?? '(无标题)'}</strong></div>
                  <small>
                    {[event.city, event.weather, event.mood].filter(Boolean).join(' · ')}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
