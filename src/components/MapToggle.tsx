import TravelIcon from './ui/TravelIcon';
import type { Scope } from '../types';

interface MapToggleProps {
  scope: Scope;
  onChange: (scope: Scope) => void;
}

export function MapToggle({ scope, onChange }: MapToggleProps) {
  return (
    <div className={`toggle-group toggle-group-${scope}`}>
      <span className="toggle-slider" aria-hidden="true" />
      <button
        type="button"
        className={scope === 'domestic' ? 'toggle-button active' : 'toggle-button'}
        onClick={() => onChange('domestic')}
      >
        <span className="toggle-button-icon">
          <TravelIcon name="compass" size={14} />
        </span>
        国内地图
      </button>
      <button
        type="button"
        className={scope === 'international' ? 'toggle-button active' : 'toggle-button'}
        onClick={() => onChange('international')}
      >
        <span className="toggle-button-icon">
          <TravelIcon name="globe" size={14} />
        </span>
        世界地图
      </button>
    </div>
  );
}

export default MapToggle;
