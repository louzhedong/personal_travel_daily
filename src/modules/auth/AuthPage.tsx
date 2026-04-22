import { useState, type FormEvent } from 'react';

interface AuthPageProps {
  onLogin: (input: { username: string; password: string }) => Promise<void>;
  onRegister: (input: { nickname: string; username: string; password: string }) => Promise<void>;
}

type AuthMode = 'login' | 'register';

function AuthPage({ onLogin, onRegister }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [nickname, setNickname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetError = () => setError('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetError();

    if (mode === 'register' && password !== confirmPassword) {
      setError('两次输入的密码不一致。');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await onLogin({
          username: username.trim(),
          password,
        });
      } else {
        await onRegister({
          nickname: nickname.trim(),
          username: username.trim(),
          password,
        });
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '提交失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-hero-panel">
        <span className="auth-kicker">Voyage Atlas</span>
        <h1>登录后开启你的专属旅行地图</h1>
        <p>
          用账号保存自己的足迹、同行人、攻略收藏和搜索历史。每个账号都有独立数据空间，刷新页面也能保持登录状态。
        </p>
        <div className="auth-feature-list">
          <span>地图足迹与时间线自动归档</span>
          <span>同账号下可继续管理多位旅行同行人</span>
          <span>攻略收藏、关联与搜索历史跨刷新保留</span>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-card-header">
          <div>
            <span className="auth-card-eyebrow">{mode === 'login' ? '欢迎回来' : '创建账号'}</span>
            <h2>{mode === 'login' ? '登录 Voyage Atlas' : '注册新账号'}</h2>
          </div>
          <div className="auth-mode-switch">
            <button
              type="button"
              className={mode === 'login' ? 'auth-mode-button is-active' : 'auth-mode-button'}
              onClick={() => {
                setMode('login');
                resetError();
              }}
            >
              登录
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'auth-mode-button is-active' : 'auth-mode-button'}
              onClick={() => {
                setMode('register');
                resetError();
              }}
            >
              注册
            </button>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <label className="field">
              <span className="field-label">昵称</span>
              <input
                className="field-control"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="例如：小悠的旅行档案"
                disabled={submitting}
              />
            </label>
          ) : null}

          <label className="field">
            <span className="field-label">用户名</span>
            <input
              className="field-control"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="输入用户名"
              disabled={submitting}
            />
          </label>

          <label className="field">
            <span className="field-label">密码</span>
            <input
              className="field-control"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 8 位密码"
              disabled={submitting}
            />
          </label>

          {mode === 'register' ? (
            <label className="field">
              <span className="field-label">确认密码</span>
              <input
                className="field-control"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="再次输入密码"
                disabled={submitting}
              />
            </label>
          ) : null}

          {error ? <p className="auth-error-banner">{error}</p> : null}

          <button type="submit" className="primary-button auth-submit-button" disabled={submitting}>
            {submitting ? '提交中...' : mode === 'login' ? '登录并进入地图' : '注册并进入地图'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AuthPage;
