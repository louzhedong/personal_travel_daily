import { useEffect, useMemo, useState } from 'react';
import AppToast, { type AppToastTone } from '../../components/ui/AppToast';
import RoutePageSkeleton from '../../components/ui/RoutePageSkeleton';
import {
  createMarkerTagVocabulary,
  deleteMarkerTagVocabulary,
  fetchMarkerTagVocabulary,
  updateMarkerTagVocabulary,
} from '../../lib/api/tagVocabularyApi';
import type { MarkerTagVocabularyItemDto, MarkerTagVocabularyResponseDto } from '../../lib/api/types';
import type { AuthAccount } from '../../types';

interface TagGovernancePageProps {
  account: AuthAccount;
  onLogout: () => Promise<void> | void;
  onNavigateBack: () => void;
}

function formatSource(source: MarkerTagVocabularyItemDto['source']) {
  return source === 'system' ? '系统词表' : '自定义';
}

export default function TagGovernancePage({ account, onLogout, onNavigateBack }: TagGovernancePageProps) {
  const [data, setData] = useState<MarkerTagVocabularyResponseDto | null>(null);
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: AppToastTone } | null>(null);

  const visibleCount = useMemo(() => data?.visibleItems.length ?? 0, [data]);
  const hiddenCount = useMemo(() => data?.items.filter((item) => item.isHidden).length ?? 0, [data]);

  const loadVocabulary = () => {
    setLoading(true);
    fetchMarkerTagVocabulary()
      .then((response) => {
        setData(response);
        setErrorMessage('');
      })
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : '标签词表加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVocabulary();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const applyResponse = (response: MarkerTagVocabularyResponseDto, message: string) => {
    setData(response);
    setToast({ message, tone: 'success' });
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    try {
      const response = await createMarkerTagVocabulary({ label: label.trim(), value: value.trim() || undefined });
      setLabel('');
      setValue('');
      applyResponse(response, '已新增自定义标签');
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : '新增标签失败', tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePatch = async (item: MarkerTagVocabularyItemDto, input: { isHidden?: boolean; sortOrder?: number }) => {
    try {
      const response = await updateMarkerTagVocabulary(item.value, input);
      applyResponse(response, input.isHidden === undefined ? '排序已更新' : input.isHidden ? '标签已隐藏' : '标签已恢复');
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : '更新标签失败', tone: 'error' });
    }
  };

  const handleDelete = async (item: MarkerTagVocabularyItemDto) => {
    try {
      const response = await deleteMarkerTagVocabulary(item.value);
      applyResponse(response, '已删除自定义标签');
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : '删除标签失败', tone: 'error' });
    }
  };

  if (loading && !data) {
    return <RoutePageSkeleton variant="detail" />;
  }

  return (
    <main className="tag-governance-shell">
      <header className="tag-governance-topbar">
        <button type="button" className="ghost-button" onClick={onNavigateBack}>返回首页</button>
        <button type="button" className="ghost-button" onClick={() => void onLogout()}>退出登录</button>
      </header>

      <section className="tag-governance-hero">
        <span className="hero-kicker">Tag Vocabulary</span>
        <h1>标签治理与自定义词表</h1>
        <p>{account.name} 可以保留系统主题标签，同时新增自己的旅行表达，并决定哪些标签进入录入、统计和地图筛选。</p>
      </section>

      {errorMessage ? <p className="tag-governance-error">{errorMessage}</p> : null}

      {data ? (
        <>
          <section className="tag-governance-summary" aria-label="标签词表摘要">
            <div><span>可见标签</span><strong>{visibleCount}</strong></div>
            <div><span>系统标签</span><strong>{data.systemCount}</strong></div>
            <div><span>自定义标签</span><strong>{data.customCount}</strong></div>
            <div><span>已隐藏</span><strong>{hiddenCount}</strong></div>
          </section>

          <section className="tag-governance-layout">
            <form className="tag-governance-form" onSubmit={handleCreate}>
              <span className="hero-kicker">Create</span>
              <h2>新增自定义标签</h2>
              <label className="field">
                <span className="field-label">显示名称</span>
                <input className="field-control" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="例如：温泉" maxLength={20} />
              </label>
              <label className="field">
                <span className="field-label">标签值</span>
                <input className="field-control" value={value} onChange={(event) => setValue(event.target.value)} placeholder="例如：onsen，可留空自动生成" maxLength={32} />
              </label>
              <button type="submit" className="primary-button" disabled={saving || !label.trim()}>{saving ? '保存中...' : '新增标签'}</button>
            </form>

            <section className="tag-governance-list" aria-label="账号标签词表">
              {data.items.map((item) => (
                <article key={item.value} className={item.isHidden ? 'tag-governance-row is-hidden' : 'tag-governance-row'}>
                  <div className="tag-governance-row-main">
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.value} · {formatSource(item.source)} · 使用 {item.usageCount} 次</span>
                    </div>
                    <em>{item.isHidden ? '已隐藏' : '可见'}</em>
                  </div>
                  <div className="tag-governance-actions">
                    <button type="button" className="ghost-button" onClick={() => handlePatch(item, { sortOrder: Math.max(0, item.sortOrder - 10) })}>上移</button>
                    <button type="button" className="ghost-button" onClick={() => handlePatch(item, { sortOrder: item.sortOrder + 10 })}>下移</button>
                    <button type="button" className="ghost-button" onClick={() => handlePatch(item, { isHidden: !item.isHidden })}>{item.isHidden ? '恢复' : '隐藏'}</button>
                    {item.source === 'custom' ? (
                      <button type="button" className="ghost-button tag-governance-danger" onClick={() => handleDelete(item)} disabled={item.usageCount > 0}>删除</button>
                    ) : null}
                  </div>
                </article>
              ))}
            </section>
          </section>
        </>
      ) : null}
      <AppToast open={!!toast} message={toast?.message ?? ''} tone={toast?.tone} />
    </main>
  );
}
