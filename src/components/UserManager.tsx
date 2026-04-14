import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import FancySelect from './FancySelect';
import TravelIcon from './TravelIcon';
import type { UserProfile } from '../types';

const presetColors = ['#2563eb', '#f97316', '#14b8a6', '#8b5cf6', '#ef4444', '#22c55e'];
const colorThemes = [
  { color: '#2563eb', name: '海岸蓝' },
  { color: '#f97316', name: '落日橙' },
  { color: '#14b8a6', name: '海风青' },
  { color: '#8b5cf6', name: '暮色紫' },
  { color: '#ef4444', name: '珊瑚红' },
  { color: '#22c55e', name: '山野绿' },
];

function getUserInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : '?';
}

interface UserManagerProps {
  users: UserProfile[];
  activeUserId: string;
  onSwitch: (userId: string) => void;
  onCreate: (payload: { name: string; color: string }) => void;
}

export function UserManager({ users, activeUserId, onSwitch, onCreate }: UserManagerProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(presetColors[2]);

  const activeUser = useMemo(
    () => users.find((item) => item.id === activeUserId),
    [activeUserId, users],
  );
  const toneStyle = (tone: string) => ({ '--tone-color': tone } as CSSProperties);

  return (
    <section className="card panel-card stack gap-20 user-manager-card">
      <div className="section-heading">
        <div className="user-manager-heading">
          <div className="user-manager-title-row">
            <span className="travel-icon-badge travel-icon-badge-orange user-manager-icon">
              <TravelIcon name="users" size={16} />
            </span>
            <h3>旅伴管理</h3>
          </div>
          <p>切换当前记录者，并用颜色区分不同用户的旅行足迹。</p>
        </div>
        {activeUser ? (
          <span className="active-user-badge user-manager-active-badge">
            <span className="user-status-dot" aria-hidden="true" />
            <span className="user-avatar-badge user-avatar-badge-toned" style={toneStyle(activeUser.color)}>
              {getUserInitial(activeUser.name)}
            </span>
            当前用户：{activeUser.name}
          </span>
        ) : null}
      </div>

      <div className="user-manager-group">
        <div className="user-manager-group-header">
          <span className="travel-icon-badge travel-icon-badge-blue user-manager-subicon">
            <TravelIcon name="route" size={14} />
          </span>
          <div>
            <strong className="user-manager-group-title">切换旅伴</strong>
            <p className="user-manager-group-text">快速切换当前记录视角，查看不同用户的地图足迹。</p>
          </div>
        </div>
        <label className="field">
          <span className="field-label">当前记录者</span>
          <FancySelect
            value={activeUserId}
            onChange={onSwitch}
            placeholder="请选择用户"
            options={users.map((user) => ({
              value: user.id,
              label: user.name,
            }))}
          />
        </label>

        <div className="user-chip-list user-manager-chip-list">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              className={user.id === activeUserId ? 'user-chip active user-manager-chip' : 'user-chip user-manager-chip'}
              onClick={() => onSwitch(user.id)}
            >
              <span className="user-avatar-badge user-avatar-badge-small">{getUserInitial(user.name)}</span>
              <span
                className="color-dot tone-dot"
                style={toneStyle(user.color)}
              />
              {user.name}
            </button>
          ))}
        </div>
      </div>

      <form
        className="inline-form user-manager-group"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) {
            return;
          }

          onCreate({ name: trimmed, color });
          setName('');
          const nextColor = presetColors[(presetColors.indexOf(color) + 1) % presetColors.length];
          setColor(nextColor);
        }}
      >
        <div className="user-manager-group-header">
          <span className="travel-icon-badge travel-icon-badge-teal user-manager-subicon">
            <TravelIcon name="plus" size={14} />
          </span>
          <div>
            <strong className="user-manager-group-title">新增旅伴</strong>
            <p className="user-manager-group-text">创建新的记录身份，为不同旅伴配置独立颜色与旅行视角。</p>
          </div>
        </div>
        <div className="user-manager-form-row">
          <label className="field user-manager-name-field">
            <span className="field-label">新增用户</span>
            <input
              className="field-control user-manager-name-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：家人、朋友、小队"
            />
          </label>
          <button type="submit" className="primary-button user-manager-submit">
            <span className="travel-icon-inline">
              <TravelIcon name="plus" size={14} />
            </span>
            添加用户
          </button>
        </div>
        <label className="field">
          <span className="field-label">标签颜色</span>
          <span className="user-manager-color-tip">
            <span className="travel-icon-inline">
              <TravelIcon name="palette" size={14} />
            </span>
            为这位旅伴挑一个在地图上更容易识别的颜色
          </span>
          <div className="color-picker-row">
            {colorThemes.map((item) => (
              <button
                key={item.color}
                type="button"
                aria-label={`选择颜色 ${item.name}`}
                className={item.color === color ? 'color-swatch-card active' : 'color-swatch-card'}
                onClick={() => setColor(item.color)}
              >
                <span
                  className={item.color === color ? 'color-swatch active' : 'color-swatch'}
                  style={toneStyle(item.color)}
                />
                <span className="color-theme-name">{item.name}</span>
              </button>
            ))}
          </div>
        </label>
      </form>
    </section>
  );
}

export default UserManager;
