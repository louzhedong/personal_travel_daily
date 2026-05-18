import { useEffect, useMemo, useState } from 'react';
import FancySelect from '../../components/ui/FancySelect';
import AppToast, { type AppToastTone } from '../../components/ui/AppToast';
import RoutePageSkeleton from '../../components/ui/RoutePageSkeleton';
import { fetchMemoryCapsule, updateMemoryCapsule } from '../../lib/api/memoryCapsulesApi';
import type { MemoryCapsuleConfigDto, MemoryCapsuleDetailDto, MemoryCapsuleTemplateDto } from '../../lib/api/types';
import type { AuthAccount } from '../../types';
import {
  buildUpdatedCapsuleConfig,
  getEnabledCapsuleBadges,
  getVisibleCapsulePhotos,
  moveSectionConfig,
  summarizeCapsuleMetrics,
} from './memoryCapsulePageModel';
import {
  exportMemoryCapsuleArchivePackage,
  exportMemoryCapsuleLongImage,
  exportMemoryCapsuleShareCard,
} from './memoryCapsuleExport';

interface MemoryCapsuleDetailPageProps {
  account: AuthAccount;
  capsuleId: string;
  onLogout: () => Promise<void> | void;
  onNavigateBack: () => void;
  onOpenMapReplayStory?: (targetType: 'trip' | 'year' | 'companion', targetId: string) => void;
}

const TEMPLATE_OPTIONS = [
  { value: 'editorial', label: '杂志' },
  { value: 'memoir', label: '纪念册' },
  { value: 'postcard', label: '明信片' },
  { value: 'atlas', label: '地图集' },
];

const EXPORT_PRESET_OPTIONS = [
  { value: 'balanced', label: '均衡' },
  { value: 'compact', label: '紧凑' },
  { value: 'visual', label: '视觉优先' },
];

export default function MemoryCapsuleDetailPage({
  account,
  capsuleId,
  onLogout,
  onNavigateBack,
  onOpenMapReplayStory,
}: MemoryCapsuleDetailPageProps) {
  const [detail, setDetail] = useState<MemoryCapsuleDetailDto | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSubtitle, setDraftSubtitle] = useState('');
  const [draftTemplate, setDraftTemplate] = useState<MemoryCapsuleTemplateDto>('editorial');
  const [draftConfig, setDraftConfig] = useState<MemoryCapsuleConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: AppToastTone } | null>(null);

  const showToast = (message: string, tone: AppToastTone = 'info') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMemoryCapsule(capsuleId)
      .then((response) => {
        if (cancelled) return;
        setDetail(response.capsule);
        setDraftTitle(response.capsule.capsule.title);
        setDraftSubtitle(response.capsule.capsule.subtitle ?? '');
        setDraftTemplate(response.capsule.capsule.template);
        setDraftConfig(response.capsule.config);
        setErrorMessage('');
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : '旅行胶囊加载失败');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [capsuleId]);

  const previewDetail = useMemo(() => {
    if (!detail) return null;
    return {
      ...detail,
      capsule: {
        ...detail.capsule,
        title: draftTitle || detail.capsule.title,
        subtitle: draftSubtitle || undefined,
        template: draftTemplate,
      },
    } satisfies MemoryCapsuleDetailDto;
  }, [detail, draftSubtitle, draftTemplate, draftTitle]);

  const updateConfig = (patch: Partial<MemoryCapsuleConfigDto>) => {
    if (!draftConfig) return;
    setDraftConfig(buildUpdatedCapsuleConfig(draftConfig, patch));
  };

  const handleSave = async () => {
    if (!draftConfig) return;
    setSaving(true);
    try {
      const response = await updateMemoryCapsule(capsuleId, {
        title: draftTitle,
        subtitle: draftSubtitle || null,
        template: draftTemplate,
        config: draftConfig,
      });
      setDetail(response.capsule);
      setDraftConfig(response.capsule.config);
      showToast('旅行胶囊已保存。', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '旅行胶囊保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <RoutePageSkeleton variant="story" />;
  }

  if (!detail || !draftConfig || !previewDetail) {
    return (
      <main className="memory-capsule-shell">
        <section className="memory-capsule-state">
          <h1>旅行胶囊暂时无法打开</h1>
          <p>{errorMessage || '这枚胶囊不存在或源内容不可用。'}</p>
          <button type="button" className="ghost-button" onClick={onNavigateBack}>
            返回胶囊中心
          </button>
        </section>
      </main>
    );
  }

  const visiblePhotos = getVisibleCapsulePhotos(previewDetail.content);
  const badges = getEnabledCapsuleBadges(previewDetail.content);
  const replayTargetType = previewDetail.capsule.type === 'annual' ? 'year' : previewDetail.capsule.type;

  return (
    <main className={`memory-capsule-detail memory-capsule-template-${draftTemplate}`}>
      <header className="memory-capsule-topbar">
        <button type="button" className="ghost-button" onClick={onNavigateBack}>
          返回首页
        </button>
        <div className="memory-capsule-topbar-actions">
          <button type="button" className="primary-button" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存胶囊'}
          </button>
          <button type="button" className="ghost-button" onClick={() => void onLogout()}>
            退出登录
          </button>
        </div>
      </header>

      <div className="memory-capsule-editor-layout">
        <article className="memory-capsule-preview">
          <section className="memory-capsule-preview-hero">
            {previewDetail.content.hero.coverImageUrl ? (
              <img src={previewDetail.content.hero.coverImageUrl} alt={`${previewDetail.capsule.title} 封面`} />
            ) : null}
            <div>
              <span className="hero-kicker">{previewDetail.content.hero.eyebrow}</span>
              <h1>{previewDetail.capsule.title}</h1>
              <p>{previewDetail.capsule.subtitle || previewDetail.content.hero.subtitle}</p>
              <span>{previewDetail.content.hero.dateRange}</span>
            </div>
          </section>

          <section className="memory-capsule-preview-metrics">
            {summarizeCapsuleMetrics(previewDetail.content.metrics).map((metric) => (
              <div key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.description}</p>
              </div>
            ))}
          </section>

          <section className="memory-capsule-preview-badges">
            {badges.map((badge) => (
              <div key={badge.id}>
                <span>{badge.label}</span>
                <strong>{badge.value}</strong>
                <p>{badge.description}</p>
              </div>
            ))}
          </section>

          {previewDetail.content.sections.map((section) => (
            <section key={section.id} className="memory-capsule-preview-section">
              <span className="hero-kicker">{section.eyebrow}</span>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}

          <section className="memory-capsule-photo-grid">
            {visiblePhotos.map((photo) => (
              <figure key={photo.imageId}>
                <img src={photo.imageUrl} alt={photo.caption || photo.title} />
                <figcaption>{photo.caption || photo.title}</figcaption>
              </figure>
            ))}
          </section>
        </article>

        <aside className="memory-capsule-editor-panel">
          <div className="memory-capsule-editor-account">当前账号 {account.name}</div>
          <label>
            标题
            <input className="field-control" value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} />
          </label>
          <label>
            副标题
            <textarea className="field-control" value={draftSubtitle} onChange={(event) => setDraftSubtitle(event.target.value)} />
          </label>
          <label>
            模板
            <FancySelect
              value={draftTemplate}
              options={TEMPLATE_OPTIONS}
              onChange={(value) => setDraftTemplate(value as MemoryCapsuleTemplateDto)}
              placeholder="选择模板"
              ariaLabel="选择模板"
            />
          </label>
          <label>
            导出偏好
            <FancySelect
              value={draftConfig.exportPreset}
              options={EXPORT_PRESET_OPTIONS}
              onChange={(value) => updateConfig({ exportPreset: value as MemoryCapsuleConfigDto['exportPreset'] })}
              placeholder="导出偏好"
              ariaLabel="导出偏好"
            />
          </label>

          <section>
            <h2>章节</h2>
            {[...draftConfig.sections].sort((left, right) => left.sortOrder - right.sortOrder).map((section) => (
              <div key={section.id} className="memory-capsule-editor-row">
                <label>
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={(event) =>
                      updateConfig({
                        sections: draftConfig.sections.map((item) =>
                          item.id === section.id ? { ...item, enabled: event.target.checked } : item,
                        ),
                      })
                    }
                  />
                  {section.titleOverride || section.id}
                </label>
                <button type="button" className="ghost-button" onClick={() => updateConfig({ sections: moveSectionConfig(draftConfig.sections, section.id, 'up') })}>
                  上移
                </button>
                <button type="button" className="ghost-button" onClick={() => updateConfig({ sections: moveSectionConfig(draftConfig.sections, section.id, 'down') })}>
                  下移
                </button>
              </div>
            ))}
          </section>

          <section>
            <h2>照片</h2>
            {draftConfig.photos.slice(0, 12).map((photo) => (
              <label key={photo.imageId} className="memory-capsule-editor-row">
                <input
                  type="checkbox"
                  checked={!photo.hidden}
                  onChange={(event) =>
                    updateConfig({
                      photos: draftConfig.photos.map((item) =>
                        item.imageId === photo.imageId ? { ...item, hidden: !event.target.checked } : item,
                      ),
                    })
                  }
                />
                {photo.imageId}
              </label>
            ))}
          </section>

          <section className="memory-capsule-export-actions">
            <h2>导出</h2>
            <button type="button" className="primary-button" onClick={() => window.print()}>
              导出 PDF / 打印
            </button>
            <button type="button" className="ghost-button" onClick={() => exportMemoryCapsuleLongImage(previewDetail)}>
              导出长图
            </button>
            <button type="button" className="ghost-button" onClick={() => exportMemoryCapsuleShareCard(previewDetail, 'square')}>
              导出方形分享卡
            </button>
            <button type="button" className="ghost-button" onClick={() => exportMemoryCapsuleShareCard(previewDetail, 'story')}>
              导出竖版分享卡
            </button>
            <button type="button" className="ghost-button" onClick={() => exportMemoryCapsuleArchivePackage(previewDetail)}>
              导出本地归档包
            </button>
            {onOpenMapReplayStory ? (
              <button
                type="button"
                className="ghost-button"
                onClick={() => onOpenMapReplayStory(replayTargetType, previewDetail.capsule.targetId)}
              >
                打开地图回放故事
              </button>
            ) : null}
          </section>
        </aside>
      </div>

      <AppToast open={!!toast} message={toast?.message ?? ''} tone={toast?.tone} />
    </main>
  );
}
