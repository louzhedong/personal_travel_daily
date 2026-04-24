import { useState } from 'react';
import TravelIcon from '../../components/ui/TravelIcon';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import type { AuthAccount } from '../../types';

interface AppHeroProps {
  message: string;
  onOpenGuideSearch: () => void;
  account: AuthAccount;
  onLogout: () => Promise<void> | void;
  onOpenAdmin?: () => void;
  onOpenStats?: () => void;
}

export default function AppHero({ message, onOpenGuideSearch, account, onLogout, onOpenAdmin, onOpenStats }: AppHeroProps) {
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  return (
    <header className="hero card">
      <svg className="hero-map-watermark" viewBox="0 0 640 260" fill="none" aria-hidden="true">
        <path
          d="M44 146c22-21 54-35 90-34 26 0 44 18 72 21 30 3 52-11 79-27 27-17 60-22 92-18 26 4 43 22 69 28 31 8 60-2 107-37"
          stroke="rgba(37,99,235,0.12)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M104 86c22-16 50-24 74-17 19 6 31 23 56 24 23 1 38-12 62-21 31-12 65-9 92 7 20 12 34 30 61 36"
          stroke="rgba(20,184,166,0.12)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M356 168c18-13 40-17 61-13 16 3 28 15 45 17 20 2 33-7 49-17 18-12 41-15 66-8"
          stroke="rgba(249,115,22,0.11)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M182 184c23-9 47-3 66 8 14 8 28 18 46 18 20 0 35-13 55-23 22-11 48-14 72-6"
          stroke="rgba(37,99,235,0.08)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="hero-illustration" aria-hidden="true">
        <div className="hero-orbit hero-orbit-one" />
        <div className="hero-orbit hero-orbit-two" />
        <span className="hero-route-dot hero-route-dot-one">+</span>
        <span className="hero-route-dot hero-route-dot-two">o</span>
        <span className="hero-route-dot hero-route-dot-three">o</span>
        <span className="hero-route-dot hero-route-dot-four">+</span>
        <svg className="hero-route-line" viewBox="0 0 360 220" fill="none">
          <path
            className="hero-route-path-glow"
            d="M22 148C56 134 80 66 128 72C176 78 176 168 230 164C276 160 292 116 338 72"
            stroke="url(#heroRouteGlow)"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.28"
          />
          <path
            className="hero-route-path"
            d="M22 148C56 134 80 66 128 72C176 78 176 168 230 164C276 160 292 116 338 72"
            stroke="url(#heroRoute)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="8 10"
          />
          <defs>
            <linearGradient id="heroRoute" x1="22" y1="148" x2="338" y2="72" gradientUnits="userSpaceOnUse">
              <stop stopColor="#14B8A6" />
              <stop offset="0.55" stopColor="#2563EB" />
              <stop offset="1" stopColor="#F97316" />
            </linearGradient>
            <linearGradient id="heroRouteGlow" x1="22" y1="148" x2="338" y2="72" gradientUnits="userSpaceOnUse">
              <stop stopColor="#67E8F9" />
              <stop offset="0.55" stopColor="#60A5FA" />
              <stop offset="1" stopColor="#FDBA74" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="hero-copy">
        <div className="hero-account-row">
          <button
            type="button"
            className="hero-kicker hero-kicker-button"
            aria-label="打开退出登录确认"
            onClick={() => setLogoutConfirmOpen(true)}
          >
            <span>Voyage Atlas · @{account.username}</span>
            <span className="hero-kicker-logout-hint">退出登录</span>
          </button>
        </div>
        <h1>旅行足迹地图</h1>
        <p>把每一次出发都留在地图上，记录城市、时间、照片与旅途印象，慢慢积累属于你的个人旅行档案。</p>
        <div className="hero-highlight-row">
          <span className="hero-highlight-chip">
            <span className="travel-icon-badge travel-icon-badge-blue">
              <TravelIcon name="route" size={14} />
            </span>
            地图足迹
          </span>
          <span className="hero-highlight-chip">
            <span className="travel-icon-badge travel-icon-badge-orange">
              <TravelIcon name="camera" size={14} />
            </span>
            旅行相册
          </span>
          <span className="hero-highlight-chip">
            <span className="travel-icon-badge travel-icon-badge-teal">
              <TravelIcon name="users" size={14} />
            </span>
            多人同行
          </span>
        </div>
        {onOpenStats || (account.role === 'admin' && onOpenAdmin) ? (
          <div className="hero-admin-row">
            {onOpenStats ? (
              <button type="button" className="ghost-button hero-admin-button" onClick={onOpenStats}>
                查看行程统计
              </button>
            ) : null}
            {account.role === 'admin' && onOpenAdmin ? (
              <button type="button" className="ghost-button hero-admin-button" onClick={onOpenAdmin}>
                进入后台管理
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="hero-actions">
        <div className="hero-tip-card">
          <span className="hero-tip-eyebrow">旅行提示</span>
          <strong className="hero-tip-title">
            <span className="travel-icon-inline">
              <TravelIcon name="spark" size={16} />
            </span>
            从一条路线，串起你的所有目的地
          </strong>
          <p className="hero-tip-text">{message}</p>
        </div>
        <button type="button" className="primary-button hero-guide-button" onClick={onOpenGuideSearch}>
          <span className="travel-icon-inline hero-guide-button-icon">
            <TravelIcon name="globe" size={16} />
          </span>
          搜索旅游攻略
        </button>
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        eyebrow="账号操作"
        title="确认退出当前账号？"
        description="退出后会回到登录页，但当前账号的旅行记录、收藏和搜索历史都会保留。"
        cancelText="取消"
        confirmText="确认退出"
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          void onLogout();
        }}
      />
    </header>
  );
}
