export type AppToastTone = 'success' | 'error' | 'info';

interface AppToastProps {
  open: boolean;
  message: string;
  tone?: AppToastTone;
}

export default function AppToast({ open, message, tone = 'info' }: AppToastProps) {
  if (!open || !message) {
    return null;
  }

  return (
    <div className="app-toast-layer" aria-live="polite" aria-atomic="true">
      <div className={`app-toast app-toast-${tone}`}>
        <span className="app-toast-dot" aria-hidden="true" />
        <span className="app-toast-message">{message}</span>
      </div>
    </div>
  );
}
