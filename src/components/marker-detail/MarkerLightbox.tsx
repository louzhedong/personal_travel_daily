interface MarkerLightboxProps {
  imageUrl: string | null;
  imageAlt: string;
  currentIndex: number;
  totalCount: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function MarkerLightbox({
  imageUrl,
  imageAlt,
  currentIndex,
  totalCount,
  canGoPrev,
  canGoNext,
  onClose,
  onPrev,
  onNext,
}: MarkerLightboxProps) {
  if (!imageUrl) {
    return null;
  }

  return (
    <div className="detail-lightbox-backdrop" onClick={onClose}>
      <div className="detail-lightbox-panel" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="modal-close-button detail-lightbox-close"
          aria-label="关闭图片预览"
          onClick={onClose}
        >
          ×
        </button>
        <img src={imageUrl} alt={imageAlt} className="detail-lightbox-image" />
        <div className="detail-lightbox-footer">
          <span>
            {currentIndex + 1} / {totalCount}
          </span>
          <div className="detail-lightbox-actions">
            <button type="button" className="ghost-button" disabled={!canGoPrev} onClick={onPrev}>
              上一张
            </button>
            <button type="button" className="ghost-button" disabled={!canGoNext} onClick={onNext}>
              下一张
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
