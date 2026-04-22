import { useEffect, useState } from 'react';
import { fetchSession, login, logout, register } from '../lib/api/authApi';
import type { AuthAccount } from '../types';
import AuthPage from './auth/AuthPage';
import TravelApp from './TravelApp';

type RoutePath = '/' | '/auth';

function normalizePathname(pathname: string): RoutePath {
  return pathname === '/auth' ? '/auth' : '/';
}

function replaceRoute(pathname: RoutePath) {
  if (window.location.pathname !== pathname) {
    window.history.replaceState({}, '', pathname);
  }
}

function App() {
  const [pathname, setPathname] = useState<RoutePath>(() =>
    typeof window === 'undefined' ? '/' : normalizePathname(window.location.pathname),
  );
  const [account, setAccount] = useState<AuthAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncPathname = () => setPathname(normalizePathname(window.location.pathname));
    window.addEventListener('popstate', syncPathname);
    return () => {
      window.removeEventListener('popstate', syncPathname);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchSession()
      .then((response) => {
        if (cancelled) {
          return;
        }

        setAccount(response.account);
        const nextPath = response.account ? '/' : '/auth';
        replaceRoute(nextPath);
        setPathname(nextPath);
      })
      .catch(() => {
        if (!cancelled) {
          setAccount(null);
          replaceRoute('/auth');
          setPathname('/auth');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthenticated = (nextAccount: AuthAccount) => {
    setAccount(nextAccount);
    replaceRoute('/');
    setPathname('/');
  };

  const handleLogin = async (input: { username: string; password: string }) => {
    const response = await login(input);
    handleAuthenticated(response.account);
  };

  const handleRegister = async (input: { nickname: string; username: string; password: string }) => {
    const response = await register(input);
    handleAuthenticated(response.account);
  };

  const handleLogout = async () => {
    await logout();
    setAccount(null);
    replaceRoute('/auth');
    setPathname('/auth');
  };

  if (loading) {
    return (
      <main className="auth-shell">
        <div className="auth-loading-card">
          <span className="auth-loading-eyebrow">Voyage Atlas</span>
          <strong>正在恢复登录状态...</strong>
        </div>
      </main>
    );
  }

  if (!account || pathname === '/auth') {
    return <AuthPage onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return <TravelApp account={account} onLogout={handleLogout} />;
}

export default App;
