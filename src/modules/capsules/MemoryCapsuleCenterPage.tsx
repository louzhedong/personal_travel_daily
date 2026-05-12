import { useEffect, useMemo, useState } from 'react';
import FancySelect from '../../components/ui/FancySelect';
import RoutePageSkeleton from '../../components/ui/RoutePageSkeleton';
import {
  archiveMemoryCapsule,
  createMemoryCapsule,
  duplicateMemoryCapsule,
  listMemoryCapsules,
} from '../../lib/api/memoryCapsulesApi';
import type { MemoryCapsuleSummaryDto, MemoryCapsuleTypeDto } from '../../lib/api/types';
import type { AuthAccount } from '../../types';
import { MEMORY_CAPSULE_TYPE_LABELS } from './memoryCapsulePageModel';

interface MemoryCapsuleCenterPageProps {
  account: AuthAccount;
  onLogout: () => Promise<void> | void;
  onNavigateBack: () => void;
  onOpenCapsule: (capsuleId: string) => void;
}

const TYPE_OPTIONS = [
  { value: 'trip', label: '行程胶囊' },
  { value: 'annual', label: '年度胶囊' },
  { value: 'companion', label: '旅伴胶囊' },
];

const FILTER_OPTIONS = [{ value: 'all', label: '全部胶囊' }, ...TYPE_OPTIONS];

export default function MemoryCapsuleCenterPage({
  account,
  onLogout,
  onNavigateBack,
  onOpenCapsule,
}: MemoryCapsuleCenterPageProps) {
  const [capsules, setCapsules] = useState<MemoryCapsuleSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [type, setType] = useState<MemoryCapsuleTypeDto>('trip');
  const [targetId, setTargetId] = useState('');
  const [title, setTitle] = useState('');

  const loadCapsules = () => {
    setLoading(true);
    listMemoryCapsules()
      .then((response) => {
        setCapsules(response.capsules);
        setErrorMessage('');
      })
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : '旅行胶囊加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCapsules();
  }, []);

  const filteredCapsules = useMemo(
    () => (filter === 'all' ? capsules : capsules.filter((capsule) => capsule.type === filter)),
    [capsules, filter],
  );

  const stats = useMemo(
    () => ({
      total: capsules.length,
      trip: capsules.filter((capsule) => capsule.type === 'trip').length,
      annual: capsules.filter((capsule) => capsule.type === 'annual').length,
      companion: capsules.filter((capsule) => capsule.type === 'companion').length,
    }),
    [capsules],
  );

  const handleCreate = async () => {
    if (!targetId.trim()) {
      setErrorMessage('请先填写目标 ID。');
      return;
    }
    setSaving(true);
    try {
      const response = await createMemoryCapsule({
        type,
        targetId: targetId.trim(),
        title: title.trim() || undefined,
      });
      setTargetId('');
      setTitle('');
      setErrorMessage('');
      onOpenCapsule(response.capsule.capsule.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '旅行胶囊创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (capsuleId: string) => {
    setSaving(true);
    try {
      const response = await duplicateMemoryCapsule(capsuleId);
      onOpenCapsule(response.capsule.capsule.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '胶囊复制失败');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (capsuleId: string) => {
    setSaving(true);
    try {
      await archiveMemoryCapsule(capsuleId);
      loadCapsules();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '胶囊归档失败');
      setSaving(false);
    }
  };

  if (loading) {
    return <RoutePageSkeleton variant="detail" />;
  }

  return (
    <main className="memory-capsule-shell">
      <header className="memory-capsule-topbar">
        <button type="button" className="ghost-button" onClick={onNavigateBack}>
          返回首页
        </button>
        <button type="button" className="ghost-button" onClick={() => void onLogout()}>
          退出登录
        </button>
      </header>

      <section className="memory-capsule-hero">
        <span className="hero-kicker">Memory Capsules</span>
        <h1>旅行胶囊</h1>
        <p>{account.name} 的私密旅行出版台，集中管理行程、年度与旅伴回忆。</p>
      </section>

      <section className="memory-capsule-stats" aria-label="胶囊统计">
        <span>全部 {stats.total}</span>
        <span>行程 {stats.trip}</span>
        <span>年度 {stats.annual}</span>
        <span>旅伴 {stats.companion}</span>
      </section>

      <section className="memory-capsule-create-panel">
        <div>
          <span className="hero-kicker">Create</span>
          <h2>创建胶囊</h2>
          <p>输入目标 ID：行程 ID、四位年份，或旅伴 ID。</p>
        </div>
        <div className="memory-capsule-create-form">
          <FancySelect
            value={type}
            options={TYPE_OPTIONS}
            onChange={(value) => setType(value as MemoryCapsuleTypeDto)}
            placeholder="胶囊类型"
            ariaLabel="胶囊类型"
          />
          <input
            className="field-control"
            value={targetId}
            placeholder="目标 ID / 年份"
            onChange={(event) => setTargetId(event.target.value)}
          />
          <input
            className="field-control"
            value={title}
            placeholder="自定义标题（可选）"
            onChange={(event) => setTitle(event.target.value)}
          />
          <button type="button" className="primary-button" onClick={handleCreate} disabled={saving}>
            {saving ? '创建中...' : '创建胶囊'}
          </button>
        </div>
      </section>

      {errorMessage ? <p className="memory-capsule-error">{errorMessage}</p> : null}

      <section className="memory-capsule-list-head">
        <div>
          <span className="hero-kicker">Library</span>
          <h2>胶囊目录</h2>
        </div>
        <FancySelect
          value={filter}
          options={FILTER_OPTIONS}
          onChange={setFilter}
          placeholder="筛选胶囊"
          ariaLabel="筛选胶囊"
        />
      </section>

      <section className="memory-capsule-list" aria-label="旅行胶囊列表">
        {filteredCapsules.length === 0 ? (
          <div className="memory-capsule-empty">还没有符合条件的旅行胶囊。</div>
        ) : (
          filteredCapsules.map((capsule) => (
            <article key={capsule.id} className="memory-capsule-list-item">
              {capsule.coverImageUrl ? <img src={capsule.coverImageUrl} alt={`${capsule.title} 封面`} /> : <div />}
              <div>
                <span>{MEMORY_CAPSULE_TYPE_LABELS[capsule.type]} · {capsule.targetLabel}</span>
                <h3>{capsule.title}</h3>
                <p>{capsule.subtitle || `更新于 ${new Date(capsule.updatedAt).toLocaleDateString('zh-CN')}`}</p>
              </div>
              <div className="memory-capsule-item-actions">
                <button type="button" className="primary-button" onClick={() => onOpenCapsule(capsule.id)}>
                  打开
                </button>
                <button type="button" className="ghost-button" onClick={() => void handleDuplicate(capsule.id)} disabled={saving}>
                  复制
                </button>
                <button type="button" className="ghost-button" onClick={() => void handleArchive(capsule.id)} disabled={saving}>
                  归档
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
