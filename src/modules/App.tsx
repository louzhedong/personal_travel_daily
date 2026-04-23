import { useEffect, useState } from 'react';
import { fetchSession, login, logout, register } from '../lib/api/authApi';
import type { AuthAccount } from '../types';
import AdminPage from './admin/AdminPage';
import AuthPage from './auth/AuthPage';
import TravelApp from './TravelApp';

type RoutePath = '/' | '/login' | '/register' | '/admin';

function normalizePathname(pathname: string): RoutePath {
  if (pathname === '/admin') {
    return '/admin';
  }

  if (pathname === '/register') {
    return '/register';
  }

  if (pathname === '/login' || pathname === '/auth') {
    return '/login';
  }

  return '/';
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
  const [entryMessage, setEntryMessage] = useState<string | null>(null);

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
        let nextPath: RoutePath;
        if (!response.account) {
          nextPath = pathname === '/register' ? '/register' : '/login';
        } else if (pathname === '/admin' && response.account.role !== 'admin') {
          nextPath = '/';
          setEntryMessage('当前账号没有后台权限，已为你返回旅行主页。');
        } else if (pathname === '/admin' && response.account.role === 'admin') {
          nextPath = '/admin';
        } else {
          nextPath = '/';
        }
        replaceRoute(nextPath);
        setPathname(nextPath);
      })
      .catch(() => {
        if (!cancelled) {
          setAccount(null);
          const nextPath = pathname === '/register' ? '/register' : '/login';
          replaceRoute(nextPath);
          setPathname(nextPath);
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
    setEntryMessage(null);
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
    setEntryMessage(null);
    replaceRoute('/login');
    setPathname('/login');
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

  if (!account || pathname === '/login' || pathname === '/register') {
    return (
      <AuthPage
        mode={pathname === '/register' ? 'register' : 'login'}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onNavigateLogin={() => {
          replaceRoute('/login');
          setPathname('/login');
        }}
        onNavigateRegister={() => {
          replaceRoute('/register');
          setPathname('/register');
        }}
      />
    );
  }

  if (pathname === '/admin') {
    return (
      <AdminPage
        account={account}
        onLogout={handleLogout}
        onNavigateHome={() => {
          setEntryMessage(null);
          replaceRoute('/');
          setPathname('/');
        }}
      />
    );
  }

  return (
    <TravelApp
      account={account}
      onLogout={handleLogout}
      onOpenAdmin={
        account.role === 'admin'
          ? () => {
              setEntryMessage(null);
              replaceRoute('/admin');
              setPathname('/admin');
            }
          : undefined
      }
      entryMessage={entryMessage}
    />
  );
}

export default App;
