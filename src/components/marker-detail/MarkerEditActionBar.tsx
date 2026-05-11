interface MarkerEditActionBarProps {
  hasChanged: boolean;
  uploadingImage: boolean;
  saving: boolean;
  canSave: boolean;
  saveFeedback: string;
  onCancel: () => void;
  onSave: () => void;
}

export function MarkerEditActionBar({
  hasChanged,
  uploadingImage,
  saving,
  canSave,
  saveFeedback,
  onCancel,
  onSave,
}: MarkerEditActionBarProps) {
  const statusText = uploadingImage
    ? '图片上传中...'
    : saveFeedback && !hasChanged
      ? saveFeedback
      : hasChanged
        ? '有未保存的修改'
        : '当前没有未保存修改';

  return (
    <div className={hasChanged ? 'detail-edit-action-bar active' : 'detail-edit-action-bar'}>
      <div className="detail-edit-action-bar-inner">
        <span className={saveFeedback && !hasChanged ? 'detail-edit-status success' : 'detail-edit-status'}>
          {statusText}
        </span>
        <button
          type="button"
          className="marker-form-secondary-button"
          disabled={saving || uploadingImage}
          onClick={onCancel}
        >
          取消
        </button>
        <button type="button" className="primary-button" disabled={!canSave} onClick={onSave}>
          {saving ? '保存中...' : '保存修改'}
        </button>
      </div>
    </div>
  );
}
