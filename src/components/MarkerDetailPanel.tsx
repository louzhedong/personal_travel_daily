import { useEffect, useState } from 'react';
import { uploadImageToImgBB } from '../lib/imageUpload';
import { formatVisitedRange, getTripDays } from '../lib/date';
import {
  MARKER_BUDGET_LEVEL_LABELS,
  MARKER_BUDGET_LEVEL_OPTIONS,
  MARKER_MOOD_LABELS,
  MARKER_MOOD_OPTIONS,
  MARKER_TAG_LABELS,
  MARKER_TAG_OPTIONS,
  MARKER_TRANSPORT_LABELS,
  MARKER_TRANSPORT_OPTIONS,
  MARKER_WEATHER_LABELS,
  MARKER_WEATHER_OPTIONS,
  type MarkerBudgetLevel,
  type MarkerMood,
  type MarkerTag,
  type MarkerTransport,
  type MarkerWeather,
} from '../lib/markerMetadata';
import FancySelect from './ui/FancySelect';
import TravelIcon from './ui/TravelIcon';
import { MarkerEditActionBar } from './marker-detail/MarkerEditActionBar';
import { MarkerLightbox } from './marker-detail/MarkerLightbox';
import type { SavedGuide, TripCollection, UserProfile, VisitMarker } from '../types';

const EMPTY_TRIPS: TripCollection[] = [];
const EMPTY_GUIDES: SavedGuide[] = [];

interface MarkerDetailPanelProps {
  marker: VisitMarker | null;
  user?: UserProfile;
  open: boolean;
  canEdit: boolean;
  onClose: () => void;
  trips?: TripCollection[];
  onUpdate: (
    markerId: string,
    updates: {
      note: string;
      tags?: MarkerTag[];
      mood?: MarkerMood | null;
      weather?: MarkerWeather | null;
      transport?: MarkerTransport | null;
      budgetLevel?: MarkerBudgetLevel | null;
      imageUrls?: string[];
      tripId?: string | null;
    },
  ) => Promise<void> | void;
  relatedGuides?: SavedGuide[];
  onRemoveRelatedGuide?: (savedGuideId: string) => void;
  onOpenGuideSearch?: (query: string, scope: VisitMarker['scope']) => void;
}

export function MarkerDetailPanel({
  marker,
  user,
  open,
  canEdit,
  onClose,
  trips = EMPTY_TRIPS,
  onUpdate,
  relatedGuides = EMPTY_GUIDES,
  onRemoveRelatedGuide,
  onOpenGuideSearch,
}: MarkerDetailPanelProps) {
  const [shouldRender, setShouldRender] = useState(open);
  const [visible, setVisible] = useState(false);
  const [renderedMarker, setRenderedMarker] = useState<VisitMarker | null>(marker);
  const [renderedUser, setRenderedUser] = useState<UserProfile | undefined>(user);
  const [renderedGuides, setRenderedGuides] = useState<SavedGuide[]>(relatedGuides);
  const [renderedCanEdit, setRenderedCanEdit] = useState(canEdit);
  const [isEditing, setIsEditing] = useState(false);
  const [draftNote, setDraftNote] = useState('');
  const [draftImageUrls, setDraftImageUrls] = useState<string[]>([]);
  const [draftTripId, setDraftTripId] = useState('');
  const [draftTags, setDraftTags] = useState<MarkerTag[]>([]);
  const [draftMood, setDraftMood] = useState<MarkerMood | ''>('');
  const [draftWeather, setDraftWeather] = useState<MarkerWeather | ''>('');
  const [draftTransport, setDraftTransport] = useState<MarkerTransport | ''>('');
  const [draftBudgetLevel, setDraftBudgetLevel] = useState<MarkerBudgetLevel | ''>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const displayMarker = marker ?? renderedMarker;
  const displayUser = marker ? user : renderedUser;
  const displayGuides = marker ? relatedGuides : renderedGuides;
  const displayCanEdit = marker ? canEdit : renderedCanEdit;

  useEffect(() => {
    let timeoutId: number | undefined;

    if (open && marker) {
      setRenderedMarker(marker);
      setRenderedUser(user);
      setRenderedGuides(relatedGuides);
      setRenderedCanEdit(canEdit);
      setShouldRender(true);
      timeoutId = window.setTimeout(() => setVisible(true), 16);
    } else if (shouldRender) {
      setVisible(false);
      timeoutId = window.setTimeout(() => setShouldRender(false), 260);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [canEdit, marker, open, relatedGuides, shouldRender, user]);

  useEffect(() => {
    if (!displayMarker) {
      return;
    }
    setDraftNote(displayMarker.note);
    setDraftImageUrls(displayMarker.imageUrls ?? []);
    setDraftTripId(displayMarker.tripId ?? '');
    setDraftTags(displayMarker.tags ?? []);
    setDraftMood(displayMarker.mood ?? '');
    setDraftWeather(displayMarker.weather ?? '');
    setDraftTransport(displayMarker.transport ?? '');
    setDraftBudgetLevel(displayMarker.budgetLevel ?? '');
    setIsEditing(false);
    setEditError('');
    setSaveFeedback('');
    setLightboxIndex(null);
  }, [displayMarker]);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [shouldRender]);

  const imageUrls = isEditing ? draftImageUrls : displayMarker?.imageUrls ?? [];
  const tripDays = displayMarker ? getTripDays(displayMarker.visitedStartAt, displayMarker.visitedEndAt) : null;
  const lightboxImage = lightboxIndex !== null ? imageUrls[lightboxIndex] : null;
  const normalizedDraftNote = draftNote.trim();
  const originalNote = displayMarker?.note.trim() ?? '';
  const originalImageUrls = displayMarker?.imageUrls ?? [];
  const originalTripId = displayMarker?.tripId ?? '';
  const originalTags = displayMarker?.tags ?? [];
  const originalMood = displayMarker?.mood ?? '';
  const originalWeather = displayMarker?.weather ?? '';
  const originalTransport = displayMarker?.transport ?? '';
  const originalBudgetLevel = displayMarker?.budgetLevel ?? '';
  const currentTrip = displayMarker?.tripId ? trips.find((trip) => trip.id === displayMarker.tripId) : undefined;
  const hasChanged =
    normalizedDraftNote !== originalNote ||
    draftTripId !== originalTripId ||
    draftMood !== originalMood ||
    draftWeather !== originalWeather ||
    draftTransport !== originalTransport ||
    draftBudgetLevel !== originalBudgetLevel ||
    draftTags.length !== originalTags.length ||
    draftTags.some((item, index) => item !== originalTags[index]) ||
    draftImageUrls.length !== originalImageUrls.length ||
    draftImageUrls.some((item, index) => item !== originalImageUrls[index]);
  const canSave = hasChanged && !saving && !uploadingImage;

  const canGoPrev = lightboxIndex !== null && lightboxIndex > 0;
  const canGoNext = lightboxIndex !== null && lightboxIndex < imageUrls.length - 1;

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    if (!displayMarker) {
      return;
    }

    const imageUrls = isEditing ? draftImageUrls : displayMarker.imageUrls ?? [];
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
  }, [displayMarker, draftImageUrls, isEditing, lightboxIndex, shouldRender]);

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
    if (!displayMarker) {
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
      await onUpdate(displayMarker.id, {
        note: trimmedNote,
        tags: draftTags,
        mood: draftMood || null,
        weather: draftWeather || null,
        transport: draftTransport || null,
        budgetLevel: draftBudgetLevel || null,
        imageUrls: draftImageUrls.length > 0 ? draftImageUrls : undefined,
        tripId: draftTripId || null,
      });
      setIsEditing(false);
      setSaveFeedback('已保存修改');
    } catch (error) {
      setEditError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!displayMarker) {
      return;
    }
    setDraftNote(displayMarker.note);
    setDraftImageUrls(displayMarker.imageUrls ?? []);
    setDraftTripId(displayMarker.tripId ?? '');
    setDraftTags(displayMarker.tags ?? []);
    setDraftMood(displayMarker.mood ?? '');
    setDraftWeather(displayMarker.weather ?? '');
    setDraftTransport(displayMarker.transport ?? '');
    setDraftBudgetLevel(displayMarker.budgetLevel ?? '');
    setEditError('');
    setSaveFeedback('');
    setIsEditing(false);
  };

  const panelTitle = isEditing ? '编辑旅行记录' : '旅行记录详情';

  if (!shouldRender || !displayMarker) {
    return null;
  }
  const panelMarker = displayMarker;
  const metadataSummary = [
    panelMarker.weather ? MARKER_WEATHER_LABELS[panelMarker.weather].zh : null,
    panelMarker.transport ? MARKER_TRANSPORT_LABELS[panelMarker.transport].zh : null,
    panelMarker.budgetLevel ? MARKER_BUDGET_LEVEL_LABELS[panelMarker.budgetLevel].zh : null,
  ].filter(Boolean);

  return (
    <div className={visible ? 'detail-backdrop is-visible' : 'detail-backdrop'} onClick={onClose}>
      <aside
        className={visible ? 'detail-panel is-visible' : 'detail-panel'}
        aria-label="旅行记录详情"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="detail-panel-header">
          <div className="detail-heading-card stack gap-10">
            <div className="detail-header-actions">
              <div className="detail-header-action-group">
                {displayCanEdit && !isEditing ? (
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
                    onClick={() => onOpenGuideSearch(`${panelMarker.scopeName} ${panelMarker.city} 攻略`, panelMarker.scope)}
                  >
                    <span className="travel-icon-inline detail-action-icon">
                      <TravelIcon name="globe" size={13} />
                    </span>
                    查找攻略
                  </button>
                ) : null}
              </div>
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
                <div className="detail-title-main">
                  <h3 className="detail-title">{panelMarker.scopeName}</h3>
                  <span className="detail-city">{panelMarker.city}</span>
                </div>
                <span className="marker-scope-tag detail-scope-tag">
                  {panelMarker.scope === 'domestic' ? '国内旅行' : '国际旅行'}
                </span>
              </div>
            </div>
            <div className="detail-meta-row">
              <span className="user-pill" style={{ borderColor: displayUser?.color ?? '#cbd5e1' }}>
                <span className="color-dot" style={{ backgroundColor: displayUser?.color ?? '#94a3b8' }} />
                {displayUser?.name ?? '未知用户'}
              </span>
              <span className="marker-date-badge">{formatVisitedRange(panelMarker)}</span>
              {tripDays ? <span className="detail-trip-days">{tripDays} 天旅程</span> : null}
              <span className={currentTrip ? 'detail-trip-pill' : 'detail-trip-pill is-empty'}>
                所属行程：{currentTrip ? currentTrip.name : '未归入行程'}
              </span>
              {metadataSummary.length > 0 ? <span className="detail-trip-pill">{metadataSummary.join(' · ')}</span> : null}
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
                <div key={`${panelMarker.id}-${imageUrl}-${index}`} className="detail-image-card">
                  <button
                    type="button"
                    className="detail-image-link"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img
                      src={imageUrl}
                      alt={`${panelMarker.scopeName}-${panelMarker.city}-${index + 1}`}
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

        {!isEditing ? (
          <section className="detail-section stack gap-10">
            <div className="detail-section-heading">
              <strong>标签与元数据</strong>
            </div>
            {panelMarker.tags && panelMarker.tags.length > 0 ? (
              <div className="detail-tag-list">
                {panelMarker.tags.map((tag) => (
                  <span key={tag} className="detail-tag-pill">
                    {MARKER_TAG_LABELS[tag].zh}
                  </span>
                ))}
              </div>
            ) : (
              <span className="detail-meta-empty">还没有添加主题标签。</span>
            )}
            <div className="detail-metadata-grid">
              <div className="detail-fact-card">
                <span className="detail-fact-label">心情</span>
                <strong>{panelMarker.mood ? MARKER_MOOD_LABELS[panelMarker.mood].zh : '未填写'}</strong>
              </div>
              <div className="detail-fact-card">
                <span className="detail-fact-label">天气</span>
                <strong>{panelMarker.weather ? MARKER_WEATHER_LABELS[panelMarker.weather].zh : '未填写'}</strong>
              </div>
              <div className="detail-fact-card">
                <span className="detail-fact-label">交通方式</span>
                <strong>{panelMarker.transport ? MARKER_TRANSPORT_LABELS[panelMarker.transport].zh : '未填写'}</strong>
              </div>
              <div className="detail-fact-card">
                <span className="detail-fact-label">预算级别</span>
                <strong>{panelMarker.budgetLevel ? MARKER_BUDGET_LEVEL_LABELS[panelMarker.budgetLevel].zh : '未填写'}</strong>
              </div>
            </div>
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
            {trips.length > 0 ? (
              <label className="field">
                <span className="field-label">所属行程</span>
                <FancySelect
                  value={draftTripId}
                  onChange={(nextTripId) => {
                    setDraftTripId(nextTripId);
                    setEditError('');
                    setSaveFeedback('');
                  }}
                  placeholder="选择所属行程"
                  ariaLabel="所属行程"
                  options={[
                    { value: '', label: '暂不归入行程' },
                    ...trips.map((trip) => ({
                      value: trip.id,
                      label: trip.name,
                    })),
                  ]}
                  triggerClassName="marker-form-select"
                />
              </label>
            ) : null}
            <div className="field">
              <span className="field-label">主题标签</span>
              <div className="marker-form-tag-grid">
                {MARKER_TAG_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={draftTags.includes(option.value) ? 'marker-form-tag-chip is-active' : 'marker-form-tag-chip'}
                    onClick={() =>
                      setDraftTags((current) =>
                        current.includes(option.value)
                          ? current.filter((item) => item !== option.value)
                          : [...current, option.value],
                      )
                    }
                  >
                    {MARKER_TAG_LABELS[option.value].zh}
                  </button>
                ))}
              </div>
            </div>
            <div className="detail-metadata-edit-grid">
              <label className="field">
                <span className="field-label">心情</span>
                <FancySelect
                  value={draftMood}
                  onChange={(nextValue) => setDraftMood(nextValue as MarkerMood | '')}
                  placeholder="选择心情"
                  options={[{ value: '', label: '暂不填写' }, ...MARKER_MOOD_OPTIONS]}
                  triggerClassName="marker-form-select"
                />
              </label>
              <label className="field">
                <span className="field-label">天气</span>
                <FancySelect
                  value={draftWeather}
                  onChange={(nextValue) => setDraftWeather(nextValue as MarkerWeather | '')}
                  placeholder="选择天气"
                  options={[{ value: '', label: '暂不填写' }, ...MARKER_WEATHER_OPTIONS]}
                  triggerClassName="marker-form-select"
                />
              </label>
              <label className="field">
                <span className="field-label">交通方式</span>
                <FancySelect
                  value={draftTransport}
                  onChange={(nextValue) => setDraftTransport(nextValue as MarkerTransport | '')}
                  placeholder="选择交通方式"
                  options={[{ value: '', label: '暂不填写' }, ...MARKER_TRANSPORT_OPTIONS]}
                  triggerClassName="marker-form-select"
                />
              </label>
              <label className="field">
                <span className="field-label">预算级别</span>
                <FancySelect
                  value={draftBudgetLevel}
                  onChange={(nextValue) => setDraftBudgetLevel(nextValue as MarkerBudgetLevel | '')}
                  placeholder="选择预算级别"
                  options={[{ value: '', label: '暂不填写' }, ...MARKER_BUDGET_LEVEL_OPTIONS]}
                  triggerClassName="marker-form-select"
                />
              </label>
            </div>
            <div className="detail-edit-subsection">
              <div className="detail-section-heading">
                <strong>旅行图片</strong>
                <span>点击缩略图可预览，右上角可删除</span>
              </div>
              {draftImageUrls.length > 0 ? (
                <div className="detail-edit-image-grid">
                  {draftImageUrls.map((imageUrl, index) => (
                    <div key={`${panelMarker.id}-edit-${imageUrl}-${index}`} className="detail-image-card">
                      <button
                        type="button"
                        className="detail-image-link"
                        onClick={() => setLightboxIndex(index)}
                      >
                        <img src={imageUrl} alt={`${panelMarker.scopeName}-${panelMarker.city}-编辑图-${index + 1}`} className="detail-image" />
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
            <p className="detail-note">{panelMarker.note || '这条记录还没有填写旅行印象。'}</p>
          </section>
        ) : null}

        {!isEditing ? (
          <section className="detail-section stack gap-10">
            <div className="detail-section-heading">
              <strong>相关攻略</strong>
              <span>{displayGuides.length} 条</span>
            </div>
            {displayGuides.length > 0 ? (
              <div className="detail-related-guides">
                {displayGuides.map((guide) => (
                  <article key={guide.id} className="detail-related-guide-card">
                    <div className="detail-related-guide-top">
                      <strong>{guide.result.title}</strong>
                      <span>{guide.result.sourceName}</span>
                    </div>
                    <p>{guide.result.summary}</p>
                    <div className="detail-related-guide-actions">
                      {/^https?:\/\//.test(guide.result.sourceUrl) ? (
                        <a href={guide.result.sourceUrl} target="_blank" rel="noreferrer" className="guide-result-link">
                          查看原文
                        </a>
                      ) : null}
                      {onRemoveRelatedGuide ? (
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => onRemoveRelatedGuide(guide.id)}
                        >
                          解除关联
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="detail-related-guide-empty">还没有关联攻略，可点击上方“查找攻略”后进行关联。</p>
            )}
          </section>
        ) : null}

        <section className="detail-section detail-facts-grid">
          <div className="detail-fact-card">
            <span className="detail-fact-label">记录创建时间</span>
            <strong>{panelMarker.createdAt.slice(0, 10)}</strong>
          </div>
          <div className="detail-fact-card">
            <span className="detail-fact-label">所属范围</span>
            <strong>{panelMarker.scope === 'domestic' ? '国内地图' : '世界地图'}</strong>
          </div>
        </section>

        <MarkerLightbox
          imageUrl={lightboxImage}
          imageAlt={`${panelMarker.scopeName}-${panelMarker.city}-预览`}
          currentIndex={lightboxIndex ?? 0}
          totalCount={imageUrls.length}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((current) => (current === null ? current : current - 1))}
          onNext={() => setLightboxIndex((current) => (current === null ? current : current + 1))}
        />

        {isEditing ? (
          <MarkerEditActionBar
            hasChanged={hasChanged}
            uploadingImage={uploadingImage}
            saving={saving}
            canSave={canSave}
            saveFeedback={saveFeedback}
            onCancel={handleCancelEdit}
            onSave={() => void handleSave()}
          />
        ) : null}
      </aside>
    </div>
  );
}

export default MarkerDetailPanel;
