import { useEffect, useState } from 'react';
import { uploadImageToImgBB } from '../lib/imageUpload';
import TravelIcon from './TravelIcon';
import type { UserProfile, VisitMarker } from '../types';

function formatVisitedRange(marker: VisitMarker) {
  return marker.visitedStartAt === marker.visitedEndAt
    ? marker.visitedStartAt
    : `${marker.visitedStartAt} - ${marker.visitedEndAt}`;
}

function getTripDays(startAt: string, endAt: string) {
  if (!startAt || !endAt || endAt < startAt) {
    return null;
  }

  const start = new Date(`${startAt}T00:00:00`);
  const end = new Date(`${endAt}T00:00:00`);
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

interface MarkerDetailPanelProps {
  marker: VisitMarker | null;
  user?: UserProfile;
  open: boolean;
  canEdit: boolean;
  onClose: () => void;
  onUpdate: (markerId: string, updates: { note: string; imageUrls?: string[] }) => Promise<void> | void;
  onOpenGuideSearch?: (query: string, scope: VisitMarker['scope']) => void;
}

export function MarkerDetailPanel({
  marker,
  user,
  open,
  canEdit,
  onClose,
  onUpdate,
  onOpenGuideSearch,
}: MarkerDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftNote, setDraftNote] = useState('');
  const [draftImageUrls, setDraftImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!marker) {
      return;
    }
    setDraftNote(marker.note);
    setDraftImageUrls(marker.imageUrls ?? []);
    setIsEditing(false);
    setEditError('');
    setSaveFeedback('');
    setLightboxIndex(null);
  }, [marker]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const imageUrls = isEditing ? draftImageUrls : marker?.imageUrls ?? [];
  const tripDays = marker ? getTripDays(marker.visitedStartAt, marker.visitedEndAt) : null;
  const lightboxImage = lightboxIndex !== null ? imageUrls[lightboxIndex] : null;
  const normalizedDraftNote = draftNote.trim();
  const originalNote = marker?.note.trim() ?? '';
  const originalImageUrls = marker?.imageUrls ?? [];
  const hasChanged =
    normalizedDraftNote !== originalNote ||
    draftImageUrls.length !== originalImageUrls.length ||
    draftImageUrls.some((item, index) => item !== originalImageUrls[index]);
  const canSave = hasChanged && !saving && !uploadingImage;

  const canGoPrev = lightboxIndex !== null && lightboxIndex > 0;
  const canGoNext = lightboxIndex !== null && lightboxIndex < imageUrls.length - 1;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!marker) {
      return;
    }

    const imageUrls = isEditing ? draftImageUrls : marker.imageUrls ?? [];
    const canGoPrev = lightboxIndex !== null && lightboxIndex > 0;
    const canGoNext = lightboxIndex !== null && lightboxIndex < imageUrls.length - 1;

    const handleKeydown = (event: KeyboardEvent) => {
      if (lightboxIndex !== null) {
        if (event.key === 'Escape') {
          setLightboxIndex(null);
          return;
        }
        if (event.key === 'ArrowLeft' && canGoPrev) {
          setLightboxIndex((current) => (current === null ? current : current - 1));
          return;
        }
        if (event.key === 'ArrowRight' && canGoNext) {
          setLightboxIndex((current) => (current === null ? current : current + 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [draftImageUrls, isEditing, lightboxIndex, marker, open]);

  const handleUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    setUploadingImage(true);
    setEditError('');
    setSaveFeedback('');
    try {
      const nextUrls = await Promise.all(Array.from(files).map((file) => uploadImageToImgBB(file)));
      setDraftImageUrls((current) => [...current, ...nextUrls]);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : '图片上传失败');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!marker) {
      return;
    }

    const trimmedNote = draftNote.trim();
    if (trimmedNote.length > 500) {
      setEditError('旅行印象不能超过 500 个字符');
      return;
    }

    setSaving(true);
    setEditError('');
    setSaveFeedback('');
    try {
      await onUpdate(marker.id, {
        note: trimmedNote,
        imageUrls: draftImageUrls.length > 0 ? draftImageUrls : undefined,
      });
      setIsEditing(false);
      setSaveFeedback('已保存修改');
    } catch (error) {
      setEditError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const panelTitle = isEditing ? '编辑旅行记录' : '旅行记录详情';

  if (!open || !marker) {
    return null;
  }

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <aside
        className="detail-panel"
        aria-label="旅行记录详情"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="detail-panel-header">
          <div className="detail-heading-card stack gap-10">
            <div className="detail-header-actions">
              {canEdit && !isEditing ? (
                <button
                  type="button"
                  className="ghost-button detail-edit-button"
                  onClick={() => setIsEditing(true)}
                >
                  <span className="travel-icon-inline detail-action-icon">
                    <TravelIcon name="edit" size={13} />
                  </span>
                  编辑记录
                </button>
              ) : null}
              {!isEditing && onOpenGuideSearch ? (
                <button
                  type="button"
                  className="ghost-button detail-guide-button"
                  onClick={() => onOpenGuideSearch(`${marker.scopeName} ${marker.city} 攻略`, marker.scope)}
                >
                  <span className="travel-icon-inline detail-action-icon">
                    <TravelIcon name="globe" size={13} />
                  </span>
                  查找攻略
                </button>
              ) : null}
              <button
                type="button"
                className="modal-close-button detail-close-button"
                aria-label="关闭详情面板"
                onClick={onClose}
              >
                ×
              </button>
            </div>
            <div className="detail-heading-topline">
              <span className="travel-icon-badge travel-icon-badge-blue detail-heading-icon">
                <TravelIcon name="pin" size={15} />
              </span>
              <span className="hero-tip-eyebrow detail-eyebrow">{panelTitle}</span>
            </div>
            <div className="detail-title-row">
              <div className="detail-title-block">
                <h3 className="detail-title">{marker.scopeName}</h3>
                <span className="detail-city">{marker.city}</span>
              </div>
              <span className="marker-scope-tag detail-scope-tag">
                {marker.scope === 'domestic' ? '国内旅行' : '国际旅行'}
              </span>
            </div>
            <div className="detail-meta-row">
              <span className="user-pill" style={{ borderColor: user?.color ?? '#cbd5e1' }}>
                <span className="color-dot" style={{ backgroundColor: user?.color ?? '#94a3b8' }} />
                {user?.name ?? '未知用户'}
              </span>
              <span className="marker-date-badge">{formatVisitedRange(marker)}</span>
              {tripDays ? <span className="detail-trip-days">{tripDays} 天旅程</span> : null}
            </div>
          </div>
        </div>

        {!isEditing && imageUrls.length > 0 ? (
          <section className="detail-section stack gap-12">
            <div className="detail-section-heading">
              <strong>旅行相册</strong>
              <span>{imageUrls.length} 张</span>
            </div>
            <div className="detail-image-grid">
              {imageUrls.map((imageUrl, index) => (
                <div key={`${marker.id}-${imageUrl}-${index}`} className="detail-image-card">
                  <button
                    type="button"
                    className="detail-image-link"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img
                      src={imageUrl}
                      alt={`${marker.scopeName}-${marker.city}-${index + 1}`}
                      className="detail-image"
                    />
                  </button>
                  {isEditing ? (
                    <button
                      type="button"
                      className="detail-image-remove"
                      aria-label={`删除第 ${index + 1} 张图片`}
                      onClick={() =>
                        setDraftImageUrls((current) =>
                          current.filter((_, currentIndex) => currentIndex !== index),
                        )
                      }
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!isEditing && imageUrls.length === 0 ? (
          <section className="detail-section detail-empty-photos">
            <div className="detail-section-heading">
              <strong>旅行相册</strong>
            </div>
            <p>这条记录还没有上传旅行图片。</p>
          </section>
        ) : null}

        {isEditing ? (
          <section className="detail-section detail-edit-workspace stack gap-16">
            <div className="detail-section-heading detail-edit-heading">
              <strong>编辑工作区</strong>
              <span>{draftImageUrls.length} 张图片</span>
            </div>
            <div className="detail-edit-banner">
              <span className="travel-icon-inline detail-action-icon">
                <TravelIcon name="edit" size={13} />
              </span>
              你正在编辑这条旅行记录
            </div>
            <label className="field">
              <span className="field-label">旅行印象</span>
              <textarea
                value={draftNote}
                onChange={(event) => {
                  setDraftNote(event.target.value);
                  setEditError('');
                }}
                className="field-control marker-form-input marker-form-textarea detail-edit-textarea"
                placeholder="补充这次旅行中最值得留下的记忆"
              />
            </label>
            <div className="detail-edit-subsection">
              <div className="detail-section-heading">
                <strong>旅行图片</strong>
                <span>点击缩略图可预览，右上角可删除</span>
              </div>
              {draftImageUrls.length > 0 ? (
                <div className="detail-edit-image-grid">
                  {draftImageUrls.map((imageUrl, index) => (
                    <div key={`${marker.id}-edit-${imageUrl}-${index}`} className="detail-image-card">
                      <button
                        type="button"
                        className="detail-image-link"
                        onClick={() => setLightboxIndex(index)}
                      >
                        <img src={imageUrl} alt={`${marker.scopeName}-${marker.city}-编辑图-${index + 1}`} className="detail-image" />
                      </button>
                      <button
                        type="button"
                        className="detail-image-remove"
                        aria-label={`删除第 ${index + 1} 张图片`}
                        onClick={() =>
                          setDraftImageUrls((current) => current.filter((_, currentIndex) => currentIndex !== index))
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="detail-edit-empty">还没有图片，下面可以直接补充上传。</div>
              )}
            </div>
            <label className="detail-upload-box">
              <input
                type="file"
                accept="image/*"
                multiple
                className="detail-upload-input"
                onChange={(event) => {
                  void handleUploadImages(event.target.files);
                  event.currentTarget.value = '';
                }}
              />
              <span className="detail-upload-title">{uploadingImage ? '上传中...' : '添加旅行图片'}</span>
              <span className="detail-upload-subtitle">支持多图上传，默认追加到当前相册</span>
            </label>
            {editError ? <span className="marker-form-error">{editError}</span> : null}
          </section>
        ) : null}

        {!isEditing ? (
          <section className="detail-section stack gap-10">
            <div className="detail-section-heading">
              <strong>旅行印象</strong>
            </div>
            <p className="detail-note">{marker.note || '这条记录还没有填写旅行印象。'}</p>
          </section>
        ) : null}

        <section className="detail-section detail-facts-grid">
          <div className="detail-fact-card">
            <span className="detail-fact-label">记录创建时间</span>
            <strong>{marker.createdAt.slice(0, 10)}</strong>
          </div>
          <div className="detail-fact-card">
            <span className="detail-fact-label">所属范围</span>
            <strong>{marker.scope === 'domestic' ? '国内地图' : '世界地图'}</strong>
          </div>
        </section>

        {lightboxImage ? (
          <div className="detail-lightbox-backdrop" onClick={() => setLightboxIndex(null)}>
            <div className="detail-lightbox-panel" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                className="modal-close-button detail-lightbox-close"
                aria-label="关闭图片预览"
                onClick={() => setLightboxIndex(null)}
              >
                ×
              </button>
              <img
                src={lightboxImage}
                alt={`${marker.scopeName}-${marker.city}-预览`}
                className="detail-lightbox-image"
              />
              <div className="detail-lightbox-footer">
                <span>{(lightboxIndex ?? 0) + 1} / {imageUrls.length}</span>
                <div className="detail-lightbox-actions">
                  <button
                    type="button"
                    className="ghost-button"
                    disabled={!canGoPrev}
                    onClick={() => setLightboxIndex((current) => (current === null ? current : current - 1))}
                  >
                    上一张
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    disabled={!canGoNext}
                    onClick={() => setLightboxIndex((current) => (current === null ? current : current + 1))}
                  >
                    下一张
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isEditing ? (
          <div className={hasChanged ? 'detail-edit-action-bar active' : 'detail-edit-action-bar'}>
            <div className="detail-edit-action-bar-inner">
              <span className={saveFeedback && !hasChanged ? 'detail-edit-status success' : 'detail-edit-status'}>
                {uploadingImage
                  ? '图片上传中...'
                  : saveFeedback && !hasChanged
                    ? saveFeedback
                    : hasChanged
                      ? '有未保存的修改'
                      : '当前没有未保存修改'}
              </span>
              <button
                type="button"
                className="marker-form-secondary-button"
                disabled={saving || uploadingImage}
                onClick={() => {
                  setDraftNote(marker.note);
                  setDraftImageUrls(marker.imageUrls ?? []);
                  setEditError('');
                  setSaveFeedback('');
                  setIsEditing(false);
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={!canSave}
                onClick={() => void handleSave()}
              >
                {saving ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

export default MarkerDetailPanel;
