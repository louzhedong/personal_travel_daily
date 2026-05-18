import { useEffect, useMemo, useState } from 'react';
import FancySelect from './ui/FancySelect';
import DateField from './ui/DateField';
import { getTodayDateOnly, getTripDays } from '../lib/date';
import { uploadImageToImgBB } from '../lib/imageUpload';
import {
  MARKER_BUDGET_LEVEL_OPTIONS,
  MARKER_MOOD_OPTIONS,
  MARKER_TAG_OPTIONS,
  getMarkerTagLabel,
  type MarkerTagOption,
  MARKER_TRANSPORT_OPTIONS,
  MARKER_WEATHER_OPTIONS,
  type MarkerBudgetLevel,
  type MarkerMood,
  type MarkerTag,
  type MarkerTransport,
  type MarkerWeather,
} from '../lib/markerMetadata';
import type { RegionOption, Scope, TripCollection } from '../types';

export interface MarkerFormValue {
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  note: string;
  tags?: MarkerTag[];
  mood?: MarkerMood;
  weather?: MarkerWeather;
  transport?: MarkerTransport;
  budgetLevel?: MarkerBudgetLevel;
  imageUrls?: string[];
  visitedStartAt: string;
  visitedEndAt: string;
  tripId?: string;
}

interface MarkerFormProps {
  scope: Scope;
  regions: RegionOption[];
  trips?: TripCollection[];
  initialValue?: Partial<MarkerFormValue>;
  submitting?: boolean;
  submitText?: string;
  tagOptions?: MarkerTagOption[];
  onSubmit: (value: MarkerFormValue) => void | Promise<void>;
  onCancel?: () => void;
}

interface FormErrors {
  scopeId?: string;
  city?: string;
  visitedRange?: string;
  note?: string;
  image?: string;
}

export function MarkerForm({
  scope,
  regions,
  trips = [],
  initialValue,
  submitting = false,
  submitText = '保存标记',
  tagOptions = MARKER_TAG_OPTIONS,
  onSubmit,
  onCancel,
}: MarkerFormProps) {
  const [scopeId, setScopeId] = useState(initialValue?.scopeId ?? '');
  const [city, setCity] = useState(initialValue?.city ?? '');
  const [note, setNote] = useState(initialValue?.note ?? '');
  const [tags, setTags] = useState<MarkerTag[]>(initialValue?.tags ?? []);
  const [mood, setMood] = useState<MarkerMood | ''>(initialValue?.mood ?? '');
  const [weather, setWeather] = useState<MarkerWeather | ''>(initialValue?.weather ?? '');
  const [transport, setTransport] = useState<MarkerTransport | ''>(initialValue?.transport ?? '');
  const [budgetLevel, setBudgetLevel] = useState<MarkerBudgetLevel | ''>(initialValue?.budgetLevel ?? '');
  const [imageUrls, setImageUrls] = useState(initialValue?.imageUrls ?? []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [visitedStartAt, setVisitedStartAt] = useState(initialValue?.visitedStartAt ?? getTodayDateOnly());
  const [visitedEndAt, setVisitedEndAt] = useState(initialValue?.visitedEndAt ?? initialValue?.visitedStartAt ?? getTodayDateOnly());
  const [tripId, setTripId] = useState(initialValue?.tripId ?? '');
  const [errors, setErrors] = useState<FormErrors>({});

  const scopeLabel = scope === 'domestic' ? '省份' : '国家';
  const cityLabel = scope === 'domestic' ? '城市' : '城市/地区';

  const selectedRegion = useMemo(
    () => regions.find((item) => item.id === scopeId),
    [regions, scopeId],
  );

  const availableCities = useMemo(() => selectedRegion?.cities ?? [], [selectedRegion]);
  const tripDays = useMemo(() => getTripDays(visitedStartAt, visitedEndAt), [visitedEndAt, visitedStartAt]);

  const toggleTag = (tag: MarkerTag) => {
    setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  };

  useEffect(() => {
    setErrors({});
  }, [scope]);

  useEffect(() => {
    const nextRegion = regions.find((item) => item.id === scopeId);
    if (!nextRegion) {
      setScopeId('');
      setCity('');
      return;
    }

    const cities = nextRegion.cities ?? [];
    if (city && cities.length > 0 && !cities.includes(city)) {
      setCity('');
    }
  }, [regions, scopeId, city]);

  const handleRegionChange = (nextScopeId: string) => {
    const nextRegion = regions.find((item) => item.id === nextScopeId);

    setScopeId(nextScopeId);
    setCity('');
    setErrors((prev) => ({ ...prev, scopeId: undefined, city: undefined }));

    if (!nextRegion || !initialValue?.city) {
      return;
    }

    if ((nextRegion.cities ?? []).includes(initialValue.city)) {
      setCity(initialValue.city);
    }
  };

  const handleCitySelect = (nextCity: string) => {
    setCity(nextCity);
    setErrors((prev) => ({ ...prev, city: undefined }));
  };

  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }
    setUploadingImage(true);
    setErrors((prev) => ({ ...prev, image: undefined }));
    try {
      const nextUrls = await Promise.all(files.map((file) => uploadImageToImgBB(file)));
      setImageUrls((current) => [...current, ...nextUrls]);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        image: error instanceof Error ? error.message : '图片上传失败',
      }));
    } finally {
      setUploadingImage(false);
    }
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    const cities = selectedRegion?.cities ?? [];

    if (!scopeId) {
      nextErrors.scopeId = `请选择${scopeLabel}`;
    }

    if (!city.trim()) {
      nextErrors.city = `请选择或输入${cityLabel}`;
    } else if (cities.length > 0 && !cities.includes(city.trim())) {
      nextErrors.city = `${cityLabel}不在当前${scopeLabel}的可选范围内`;
    }

    if (!visitedStartAt || !visitedEndAt) {
      nextErrors.visitedRange = '请选择完整的游玩时间段';
    } else if (visitedEndAt < visitedStartAt) {
      nextErrors.visitedRange = '结束日期不能早于开始日期';
    }

    if (note.trim().length > 500) {
      nextErrors.note = '游玩描述不能超过 500 个字符';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate() || !selectedRegion) {
      return;
    }

    await onSubmit({
      scope,
      scopeId: selectedRegion.id,
      scopeName: selectedRegion.name,
      city: city.trim(),
      note: note.trim(),
      tags: tags.length > 0 ? tags : undefined,
      mood: mood || undefined,
      weather: weather || undefined,
      transport: transport || undefined,
      budgetLevel: budgetLevel || undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      visitedStartAt,
      visitedEndAt,
      tripId: tripId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="marker-form">
      <div className="marker-form-header">
        <div>
          <h3 className="marker-form-title">新增旅游标记</h3>
          <p className="marker-form-subtitle">
            当前范围：{scope === 'domestic' ? '国内旅行' : '国外旅行'}
          </p>
        </div>
      </div>

      <label className="field">
        <span className="field-label marker-form-label">{scopeLabel}</span>
        <FancySelect
          value={scopeId}
          onChange={handleRegionChange}
          placeholder={`请选择${scopeLabel}`}
          options={regions.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
          triggerClassName="marker-form-select"
        />
        {errors.scopeId ? <span className="marker-form-error">{errors.scopeId}</span> : null}
      </label>

      <label className="field">
        <span className="field-label marker-form-label">{cityLabel}选择</span>
        <FancySelect
          value={city}
          onChange={handleCitySelect}
          disabled={!scopeId || availableCities.length === 0}
          placeholder={
            !scopeId
              ? `请先选择${scopeLabel}`
              : availableCities.length === 0
                ? `当前${scopeLabel}暂无预设${cityLabel}`
                : `请选择${cityLabel}`
          }
          options={availableCities.map((item) => ({
            value: item,
            label: item,
          }))}
          triggerClassName="marker-form-select"
        />
        {selectedRegion && (selectedRegion.cities?.length ?? 0) > 0 ? (
          <span className="marker-form-hint">
            共 {(selectedRegion.cities ?? []).length} 个可选{cityLabel}
          </span>
        ) : (
          <span className="marker-form-hint">
            当前{scopeLabel}未提供预设{cityLabel}列表，可直接输入
          </span>
        )}
        {errors.city ? <span className="marker-form-error">{errors.city}</span> : null}
      </label>

      {selectedRegion && (selectedRegion.cities?.length ?? 0) === 0 ? (
        <label className="field">
          <span className="field-label marker-form-label">手动输入{cityLabel}</span>
          <input
            type="text"
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              setErrors((prev) => ({ ...prev, city: undefined }));
            }}
            placeholder={`请输入${cityLabel}`}
            className="field-control marker-form-input"
          />
        </label>
      ) : null}

      <div className="field">
        <span className="field-label marker-form-label">游玩时间段</span>
        <div className="marker-form-date-grid">
          <label className="field">
            <span className="marker-form-subfield-label">开始日期</span>
            <DateField
              value={visitedStartAt}
              max={visitedEndAt || undefined}
              ariaLabel="游玩开始日期"
              onChange={(nextValue) => {
                setVisitedStartAt(nextValue);
                setErrors((prev) => ({ ...prev, visitedRange: undefined }));
              }}
            />
          </label>
          <label className="field">
            <span className="marker-form-subfield-label">结束日期</span>
            <DateField
              value={visitedEndAt}
              min={visitedStartAt || undefined}
              ariaLabel="游玩结束日期"
              onChange={(nextValue) => {
                setVisitedEndAt(nextValue);
                setErrors((prev) => ({ ...prev, visitedRange: undefined }));
              }}
            />
          </label>
        </div>
        {tripDays ? <span className="marker-form-duration-hint">本次旅行共 {tripDays} 天</span> : null}
        {errors.visitedRange ? <span className="marker-form-error">{errors.visitedRange}</span> : null}
      </div>

      {trips.length > 0 ? (
        <label className="field">
          <span className="field-label marker-form-label">所属行程</span>
          <FancySelect
            value={tripId}
            onChange={setTripId}
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

      <label className="field">
        <span className="field-label marker-form-label">游玩描述</span>
        <textarea
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            setErrors((prev) => ({ ...prev, note: undefined }));
          }}
          placeholder="记录这次旅行的亮点、美食、路线或特别感受"
          rows={5}
          className="field-control marker-form-input marker-form-textarea"
        />
        <span className="marker-form-hint">{note.trim().length}/500</span>
        {errors.note ? <span className="marker-form-error">{errors.note}</span> : null}
      </label>

      <div className="field">
        <span className="field-label marker-form-label">记录标签</span>
        <div className="marker-form-tag-grid">
          {tagOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={tags.includes(option.value) ? 'marker-form-tag-chip is-active' : 'marker-form-tag-chip'}
              onClick={() => toggleTag(option.value)}
            >
              {getMarkerTagLabel(option.value, tagOptions)}
            </button>
          ))}
        </div>
        <span className="marker-form-hint">可多选，建议选择最能代表这条记录的 1-3 个主题标签。</span>
      </div>

      <div className="marker-form-metadata-grid">
        <label className="field">
          <span className="field-label marker-form-label">心情</span>
          <FancySelect
            value={mood}
            onChange={(nextValue) => setMood(nextValue as MarkerMood | '')}
            placeholder="选择心情"
            options={[{ value: '', label: '暂不填写' }, ...MARKER_MOOD_OPTIONS]}
            triggerClassName="marker-form-select"
          />
        </label>
        <label className="field">
          <span className="field-label marker-form-label">天气</span>
          <FancySelect
            value={weather}
            onChange={(nextValue) => setWeather(nextValue as MarkerWeather | '')}
            placeholder="选择天气"
            options={[{ value: '', label: '暂不填写' }, ...MARKER_WEATHER_OPTIONS]}
            triggerClassName="marker-form-select"
          />
        </label>
        <label className="field">
          <span className="field-label marker-form-label">交通方式</span>
          <FancySelect
            value={transport}
            onChange={(nextValue) => setTransport(nextValue as MarkerTransport | '')}
            placeholder="选择交通方式"
            options={[{ value: '', label: '暂不填写' }, ...MARKER_TRANSPORT_OPTIONS]}
            triggerClassName="marker-form-select"
          />
        </label>
        <label className="field">
          <span className="field-label marker-form-label">预算级别</span>
          <FancySelect
            value={budgetLevel}
            onChange={(nextValue) => setBudgetLevel(nextValue as MarkerBudgetLevel | '')}
            placeholder="选择预算级别"
            options={[{ value: '', label: '暂不填写' }, ...MARKER_BUDGET_LEVEL_OPTIONS]}
            triggerClassName="marker-form-select"
          />
        </label>
      </div>

      <div className="field">
        <span className="field-label marker-form-label">旅行图片</span>
        <label className="marker-form-upload">
          <input
            type="file"
            accept="image/*"
            multiple
            className="marker-form-file-input"
            disabled={uploadingImage || submitting}
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length === 0) {
                return;
              }
              void handleImageUpload(files);
              event.currentTarget.value = '';
            }}
          />
          <span className="ghost-button marker-form-upload-button">
            {uploadingImage ? '上传中...' : imageUrls.length > 0 ? '继续上传图片' : '上传图片'}
          </span>
        </label>
        {imageUrls.length > 0 ? <span className="marker-form-hint">已上传 {imageUrls.length} 张图片</span> : null}
        {imageUrls.length > 0 ? (
          <div className="marker-form-image-grid">
            {imageUrls.map((url, index) => (
              <a
                key={`${url}-${index}`}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="marker-form-image-card"
                aria-label={`查看第 ${index + 1} 张原图`}
              >
                <img src={url} alt={`旅行图片预览 ${index + 1}`} className="marker-form-image" />
                <button
                  type="button"
                  className="marker-form-image-delete"
                  aria-label={`删除第 ${index + 1} 张图片`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setImageUrls((current) => current.filter((_, currentIndex) => currentIndex !== index));
                  }}
                >
                  ×
                </button>
              </a>
            ))}
          </div>
        ) : null}
        {errors.image ? <span className="marker-form-error">{errors.image}</span> : null}
      </div>

      <div className="marker-form-actions">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="marker-form-secondary-button">
            取消
          </button>
        ) : null}
        <button type="submit" disabled={submitting || uploadingImage} className="primary-button marker-form-primary-button">
          {submitting ? '保存中...' : submitText}
        </button>
      </div>
    </form>
  );
}

export default MarkerForm;
