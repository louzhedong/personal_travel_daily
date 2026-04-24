import { useEffect, useState } from 'react';
import { fetchSession, login, logout, register } from '../lib/api/authApi';
import type { AuthAccount } from '../types';
import AdminPage from './admin/AdminPage';
import AuthPage from './auth/AuthPage';
import TravelApp from './TravelApp';
import StatsPage from './stats/StatsPage';
import TripDetailPage from './trips/TripDetailPage';

type AppRoute =
  | { kind: 'home'; pathname: '/' }
  | { kind: 'login'; pathname: '/login' }
  | { kind: 'register'; pathname: '/register' }
  | { kind: 'admin'; pathname: '/admin' }
  | { kind: 'stats'; pathname: '/stats' }
  | { kind: 'tripDetail'; pathname: string; tripId: string };

function createHomeRoute(): AppRoute {
  return { kind: 'home', pathname: '/' };
}

function createLoginRoute(): AppRoute {
  return { kind: 'login', pathname: '/login' };
}

function createRegisterRoute(): AppRoute {
  return { kind: 'register', pathname: '/register' };
}

function createAdminRoute(): AppRoute {
  return { kind: 'admin', pathname: '/admin' };
}

function createStatsRoute(): AppRoute {
  return { kind: 'stats', pathname: '/stats' };
}

function createTripDetailRoute(tripId: string): AppRoute {
  return {
    kind: 'tripDetail',
    pathname: `/trips/${encodeURIComponent(tripId)}`,
    tripId,
  };
}

function normalizePathname(pathname: string): AppRoute {
  const tripDetailMatch = pathname.match(/^\/trips\/([^/]+)$/);
  if (tripDetailMatch) {
    return createTripDetailRoute(decodeURIComponent(tripDetailMatch[1]));
  }

  if (pathname === '/admin') {
    return createAdminRoute();
  }

  if (pathname === '/stats') {
    return createStatsRoute();
  }

  if (pathname === '/register') {
    return createRegisterRoute();
  }

  if (pathname === '/login' || pathname === '/auth') {
    return createLoginRoute();
  }

  return createHomeRoute();
}

function replaceRoute(route: AppRoute) {
  if (window.location.pathname !== route.pathname) {
    window.history.replaceState({}, '', route.pathname);
  }
}

function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window === 'undefined' ? createHomeRoute() : normalizePathname(window.location.pathname),
  );
  const [account, setAccount] = useState<AuthAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [entryMessage, setEntryMessage] = useState<string | null>(null);

  useEffect(() => {
    const syncPathname = () => setRoute(normalizePathname(window.location.pathname));
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
        let nextRoute: AppRoute;
        if (!response.account) {
          nextRoute = route.kind === 'register' ? createRegisterRoute() : createLoginRoute();
        } else if (route.kind === 'admin' && response.account.role !== 'admin') {
          nextRoute = createHomeRoute();
          setEntryMessage('当前账号没有后台权限，已为你返回旅行主页。');
        } else if (route.kind === 'admin' && response.account.role === 'admin') {
          nextRoute = createAdminRoute();
        } else if (route.kind === 'tripDetail') {
          nextRoute = createTripDetailRoute(route.tripId);
        } else if (route.kind === 'stats') {
          nextRoute = createStatsRoute();
        } else {
          nextRoute = createHomeRoute();
        }
        replaceRoute(nextRoute);
        setRoute(nextRoute);
      })
      .catch(() => {
        if (!cancelled) {
          setAccount(null);
          const nextRoute = route.kind === 'register' ? createRegisterRoute() : createLoginRoute();
          replaceRoute(nextRoute);
          setRoute(nextRoute);
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
    const nextRoute = createHomeRoute();
    replaceRoute(nextRoute);
    setRoute(nextRoute);
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
    const nextRoute = createLoginRoute();
    replaceRoute(nextRoute);
    setRoute(nextRoute);
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

  if (!account || route.kind === 'login' || route.kind === 'register') {
    return (
      <AuthPage
        mode={route.kind === 'register' ? 'register' : 'login'}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onNavigateLogin={() => {
          const nextRoute = createLoginRoute();
          replaceRoute(nextRoute);
          setRoute(nextRoute);
        }}
        onNavigateRegister={() => {
          const nextRoute = createRegisterRoute();
          replaceRoute(nextRoute);
          setRoute(nextRoute);
        }}
      />
    );
  }

  if (route.kind === 'admin') {
    return (
      <AdminPage
        account={account}
        onLogout={handleLogout}
        onNavigateHome={() => {
          setEntryMessage(null);
          const nextRoute = createHomeRoute();
          replaceRoute(nextRoute);
          setRoute(nextRoute);
        }}
      />
    );
  }

  if (route.kind === 'tripDetail') {
    return (
      <TripDetailPage
        account={account}
        tripId={route.tripId}
        onLogout={handleLogout}
        onNavigateBack={() => {
          setEntryMessage(null);
          const nextRoute = createStatsRoute();
          replaceRoute(nextRoute);
          setRoute(nextRoute);
        }}
      />
    );
  }

  if (route.kind === 'stats') {
    return (
      <StatsPage
        account={account}
        onLogout={handleLogout}
        onNavigateHome={() => {
          setEntryMessage(null);
          const nextRoute = createHomeRoute();
          replaceRoute(nextRoute);
          setRoute(nextRoute);
        }}
        onOpenTripDetail={(tripId) => {
          const nextRoute = createTripDetailRoute(tripId);
          replaceRoute(nextRoute);
          setRoute(nextRoute);
        }}
      />
    );
  }

  return (
    <TravelApp
      account={account}
      onLogout={handleLogout}
      onOpenStats={() => {
        const nextRoute = createStatsRoute();
        replaceRoute(nextRoute);
        setRoute(nextRoute);
      }}
      onOpenAdmin={
        account.role === 'admin'
          ? () => {
              setEntryMessage(null);
              const nextRoute = createAdminRoute();
              replaceRoute(nextRoute);
              setRoute(nextRoute);
            }
          : undefined
      }
      entryMessage={entryMessage}
    />
  );
}

export default App;
