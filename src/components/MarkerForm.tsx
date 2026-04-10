import { useEffect, useMemo, useState } from 'react';
import FancySelect from './FancySelect';
import { uploadImageToImgBB } from '../lib/imageUpload';
import type { RegionOption, Scope } from '../types';

export interface MarkerFormValue {
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  note: string;
  imageUrls?: string[];
  visitedStartAt: string;
  visitedEndAt: string;
}

interface MarkerFormProps {
  scope: Scope;
  regions: RegionOption[];
  initialValue?: Partial<MarkerFormValue>;
  submitting?: boolean;
  submitText?: string;
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

function getToday() {
  return new Date().toISOString().slice(0, 10);
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

export function MarkerForm({
  scope,
  regions,
  initialValue,
  submitting = false,
  submitText = '保存标记',
  onSubmit,
  onCancel,
}: MarkerFormProps) {
  const [scopeId, setScopeId] = useState(initialValue?.scopeId ?? '');
  const [city, setCity] = useState(initialValue?.city ?? '');
  const [note, setNote] = useState(initialValue?.note ?? '');
  const [imageUrls, setImageUrls] = useState(initialValue?.imageUrls ?? []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [visitedStartAt, setVisitedStartAt] = useState(initialValue?.visitedStartAt ?? getToday());
  const [visitedEndAt, setVisitedEndAt] = useState(initialValue?.visitedEndAt ?? initialValue?.visitedStartAt ?? getToday());
  const [errors, setErrors] = useState<FormErrors>({});

  const scopeLabel = scope === 'domestic' ? '省份' : '国家';
  const cityLabel = scope === 'domestic' ? '城市' : '城市/地区';

  const selectedRegion = useMemo(
    () => regions.find((item) => item.id === scopeId),
    [regions, scopeId],
  );

  const availableCities = useMemo(() => selectedRegion?.cities ?? [], [selectedRegion]);
  const tripDays = useMemo(() => getTripDays(visitedStartAt, visitedEndAt), [visitedEndAt, visitedStartAt]);

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
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      visitedStartAt,
      visitedEndAt,
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
            <input
              type="date"
              value={visitedStartAt}
              max={visitedEndAt || undefined}
              onChange={(event) => {
                setVisitedStartAt(event.target.value);
                setErrors((prev) => ({ ...prev, visitedRange: undefined }));
              }}
              className="field-control marker-form-input"
            />
          </label>
          <label className="field">
            <span className="marker-form-subfield-label">结束日期</span>
            <input
              type="date"
              value={visitedEndAt}
              min={visitedStartAt || undefined}
              onChange={(event) => {
                setVisitedEndAt(event.target.value);
                setErrors((prev) => ({ ...prev, visitedRange: undefined }));
              }}
              className="field-control marker-form-input"
            />
          </label>
        </div>
        {tripDays ? <span className="marker-form-duration-hint">本次旅行共 {tripDays} 天</span> : null}
        {errors.visitedRange ? <span className="marker-form-error">{errors.visitedRange}</span> : null}
      </div>

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
