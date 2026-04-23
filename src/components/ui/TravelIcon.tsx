import type { CSSProperties, SVGProps } from 'react';

type TravelIconName =
  | 'compass'
  | 'camera'
  | 'users'
  | 'route'
  | 'pin'
  | 'globe'
  | 'spark'
  | 'palette'
  | 'plus'
  | 'edit';

interface TravelIconProps extends SVGProps<SVGSVGElement> {
  name: TravelIconName;
  size?: number;
}

export function TravelIcon({ name, size = 18, style, ...props }: TravelIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style,
    ...props,
  };

  switch (name) {
    case 'compass':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M14.8 9.2 13.2 13.2 9.2 14.8 10.8 10.8 14.8 9.2Z" />
        </svg>
      );
    case 'camera':
      return (
        <svg {...common}>
          <path d="M4 8h3l1.5-2h7L17 8h3v10H4Z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      );
    case 'users':
      return (
        <svg {...common}>
          <path d="M9 15c-2.5 0-4.5 1.4-5 3" />
          <path d="M15 15c2.5 0 4.5 1.4 5 3" />
          <circle cx="9" cy="9" r="3" />
          <circle cx="15" cy="9" r="3" />
        </svg>
      );
    case 'route':
      return (
        <svg {...common}>
          <circle cx="6" cy="17" r="2" />
          <circle cx="18" cy="7" r="2" />
          <path d="M8 17c4 0 4-6 8-6" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 20s5-5.2 5-9a5 5 0 1 0-10 0c0 3.8 5 9 5 9Z" />
          <circle cx="12" cy="11" r="1.7" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M4.5 9h15" />
          <path d="M4.5 15h15" />
          <path d="M12 4c2.5 2.2 3.7 5 3.7 8S14.5 17.8 12 20" />
          <path d="M12 4c-2.5 2.2-3.7 5-3.7 8S9.5 17.8 12 20" />
        </svg>
      );
    case 'spark':
      return (
        <svg {...common}>
          <path d="M12 4 13.4 8.6 18 10 13.4 11.4 12 16 10.6 11.4 6 10 10.6 8.6 12 4Z" />
        </svg>
      );
    case 'palette':
      return (
        <svg {...common}>
          <path d="M12 4a8 8 0 1 0 0 16h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h1.5A2.5 2.5 0 0 0 16 9.5 5.5 5.5 0 0 0 12 4Z" />
          <circle cx="7.5" cy="10" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="9.5" cy="7.5" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="12.5" cy="7" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 6v12" />
          <path d="M6 12h12" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...common}>
          <path d="M4 20h4l9.5-9.5a1.8 1.8 0 0 0 0-2.5l-1.5-1.5a1.8 1.8 0 0 0-2.5 0L4 16v4Z" />
          <path d="M12.5 7.5 16.5 11.5" />
        </svg>
      );
    default:
      return null;
  }
}

export function withIconVars(color: string, tint: string): CSSProperties {
  return {
    '--icon-color': color,
    '--icon-tint': tint,
  } as CSSProperties;
}

export default TravelIcon;
