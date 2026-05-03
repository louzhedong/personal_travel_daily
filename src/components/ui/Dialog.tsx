import { useEffect, type MouseEvent, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  onClose: () => void;
  children?: ReactNode;
}

export default function Dialog({ open, title, eyebrow, description, onClose, children }: DialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleCardClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div className="dialog-layer" role="presentation" onClick={onClose}>
      <div
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={handleCardClick}
      >
        {eyebrow ? <span className="dialog-eyebrow">{eyebrow}</span> : null}
        <strong id="dialog-title" className="dialog-title">
          {title}
        </strong>
        {description ? <div className="dialog-description">{description}</div> : null}
        {children}
      </div>
    </div>
  );
}
