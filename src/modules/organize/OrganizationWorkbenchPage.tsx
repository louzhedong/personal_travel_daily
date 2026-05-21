import { useEffect, useMemo, useState } from 'react';
import AppToast, { type AppToastTone } from '../../components/ui/AppToast';
import RoutePageSkeleton from '../../components/ui/RoutePageSkeleton';
import {
  applyOrganizationAction,
  fetchOrganizationWorkbench,
  previewOrganizationAction,
} from '../../lib/api/organizationApi';
import type {
  OrganizationActionInputDto,
  OrganizationActionPreviewDto,
  OrganizationIssueDto,
  OrganizationWorkbenchResponseDto,
} from '../../lib/api/types';
import type { AuthAccount } from '../../types';
import {
  ORGANIZATION_SECTION_LABELS,
  ORGANIZATION_TAG_OPTIONS,
  buildOrganizationProgressText,
  formatOrganizationDate,
  getPrimaryIssues,
} from './organizationWorkbenchModel';

interface OrganizationWorkbenchPageProps {
  account: AuthAccount;
  onLogout: () => Promise<void> | void;
  onNavigateBack: () => void;
}

function IssueRow({ issue }: { issue: OrganizationIssueDto }) {
  return (
    <article className="organization-issue-row">
      {issue.imageUrl ? <img src={issue.imageUrl} alt={`${issue.title} 旅行照片`} loading="lazy" /> : <span className="organization-issue-mark" />}
      <div>
        <span>{formatOrganizationDate(issue.occurredAt)}</span>
        <strong>{issue.title}</strong>
        <p>{issue.description}</p>
      </div>
      <em>{issue.actionHint}</em>
    </article>
  );
}

function PreviewPanel({ preview, onApply, busy }: { preview: OrganizationActionPreviewDto | null; onApply: () => void; busy: boolean }) {
  if (!preview) {
    return <p className="organization-preview-empty">先选择一个批量动作，系统会只预览不写入。</p>;
  }

  return (
    <div className="organization-preview-panel">
      <div className="organization-preview-heading">
        <span>Dry Run Preview</span>
        <strong>{preview.changeCount} 项变更待确认</strong>
      </div>
      <ul>
        {preview.changes.slice(0, 6).map((change) => (
          <li key={change.targetId}>
            <span>{change.targetTitle}</span>
            <small>{change.before} {'->'} {change.after}</small>
          </li>
        ))}
      </ul>
      <button type="button" className="primary-button" disabled={busy || preview.changeCount === 0} onClick={onApply}>
        确认执行
      </button>
    </div>
  );
}

export default function OrganizationWorkbenchPage({ account, onLogout, onNavigateBack }: OrganizationWorkbenchPageProps) {
  const [data, setData] = useState<OrganizationWorkbenchResponseDto | null>(null);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedTag, setSelectedTag] = useState<(typeof ORGANIZATION_TAG_OPTIONS)[number]['value']>('photography');
  const [preview, setPreview] = useState<OrganizationActionPreviewDto | null>(null);
  const [pendingAction, setPendingAction] = useState<OrganizationActionInputDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: AppToastTone } | null>(null);

  const showToast = (message: string, tone: AppToastTone = 'info') => setToast({ message, tone });

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeoutId = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const loadWorkbench = async () => {
    setLoading(true);
    try {
      const response = await fetchOrganizationWorkbench();
      setData(response);
      setSelectedTripId((current) => current || response.tripOptions[0]?.id || '');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '整理工作台加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkbench();
  }, []);

  const primaryIssues = useMemo(() => (data ? getPrimaryIssues(data) : []), [data]);

  const runPreview = async (action: OrganizationActionInputDto) => {
    setBusy(true);
    try {
      const response = await previewOrganizationAction(action);
      setPreview(response);
      setPendingAction(action);
      showToast('已生成预览，尚未写入数据', 'info');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '预览失败', 'error');
    } finally {
      setBusy(false);
    }
  };

  const applyPendingAction = async () => {
    if (!pendingAction) {
      return;
    }
    setBusy(true);
    try {
      const response = await applyOrganizationAction(pendingAction);
      setData(response.workbench);
      setPreview(null);
      setPendingAction(null);
      showToast('整理动作已执行', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '执行失败', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) {
    return <RoutePageSkeleton variant="detail" />;
  }

  return (
    <main className="organization-workbench-shell">
      <header className="organization-topbar">
        <button type="button" className="ghost-button" onClick={onNavigateBack}>返回首页</button>
        <button type="button" className="ghost-button" onClick={() => void onLogout()}>退出登录</button>
      </header>

      <section className="organization-hero">
        <div>
          <span className="hero-kicker">ORGANIZATION WORKBENCH · @{account.username}</span>
          <h1>整理工作台</h1>
          <p>把未归行程记录、缺说明照片、待精选素材和弱标签记录集中到一张桌面上，先预览，再确认批量整理。</p>
          {data ? <strong>{buildOrganizationProgressText(data)}</strong> : null}
        </div>
        {data ? (
          <dl className="organization-summary-strip">
            <div><dt>全部待办</dt><dd>{data.summary.totalIssues}</dd></div>
            <div><dt>未归行程</dt><dd>{data.summary.unassignedMarkers}</dd></div>
            <div><dt>缺说明照片</dt><dd>{data.summary.missingPhotoCaptions}</dd></div>
            <div><dt>弱标签</dt><dd>{data.summary.weakMarkerTags}</dd></div>
          </dl>
        ) : null}
      </section>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      {data ? (
        <section className="organization-action-board">
          <div className="organization-action-copy">
            <span>批量动作</span>
            <h2>先 Dry Run，再确认写入</h2>
            <p>每个动作会先返回变更预览；只有点击“确认执行”才会修改旅行资产。</p>
          </div>
          <div className="organization-action-controls">
            <label>
              <span>目标行程</span>
              <select value={selectedTripId} onChange={(event) => setSelectedTripId(event.target.value)}>
                {data.tripOptions.map((trip) => <option key={trip.id} value={trip.id}>{trip.name}</option>)}
              </select>
            </label>
            <button
              type="button"
              className="ghost-button"
              disabled={busy || !selectedTripId || data.sections.unassignedMarkers.length === 0}
              onClick={() => runPreview({
                type: 'assignMarkersToTrip',
                tripId: selectedTripId,
                markerIds: data.sections.unassignedMarkers.map((issue) => issue.targetId),
              })}
            >
              预览归行程
            </button>
            <label>
              <span>补充标签</span>
              <select value={selectedTag} onChange={(event) => setSelectedTag(event.target.value as typeof selectedTag)}>
                {ORGANIZATION_TAG_OPTIONS.map((tag) => <option key={tag.value} value={tag.value}>{tag.label}</option>)}
              </select>
            </label>
            <button
              type="button"
              className="ghost-button"
              disabled={busy || data.sections.weakMarkerTags.length === 0}
              onClick={() => runPreview({
                type: 'addTagsToMarkers',
                tags: [selectedTag],
                markerIds: data.sections.weakMarkerTags.map((issue) => issue.targetId),
              })}
            >
              预览补标签
            </button>
            <button
              type="button"
              className="ghost-button"
              disabled={busy || data.sections.unfeaturedPhotos.length === 0}
              onClick={() => runPreview({
                type: 'featurePhotos',
                imageIds: data.sections.unfeaturedPhotos.map((issue) => issue.targetId),
              })}
            >
              预览标记精选
            </button>
            <button
              type="button"
              className="ghost-button"
              disabled={busy || data.sections.missingPhotoCaptions.length === 0}
              onClick={() => runPreview({
                type: 'draftPhotoCaptions',
                imageIds: data.sections.missingPhotoCaptions.map((issue) => issue.targetId),
              })}
            >
              预览说明草稿
            </button>
          </div>
          <PreviewPanel preview={preview} busy={busy} onApply={applyPendingAction} />
        </section>
      ) : null}

      {data ? (
        <section className="organization-sections-grid">
          <div className="organization-section-index">
            <h2>整理队列</h2>
            {Object.entries(ORGANIZATION_SECTION_LABELS).map(([key, label]) => (
              <p key={key}><span>{label}</span><strong>{data.sections[key as keyof typeof data.sections].length}</strong></p>
            ))}
          </div>
          <div className="organization-issue-list">
            {primaryIssues.length > 0 ? primaryIssues.map((issue) => <IssueRow key={issue.id} issue={issue} />) : <p>暂无待整理项目。</p>}
          </div>
        </section>
      ) : null}
      <AppToast open={!!toast} message={toast?.message ?? ''} tone={toast?.tone} />
    </main>
  );
}
