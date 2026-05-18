import { useEffect, useState } from 'react';
import { fetchSession, login, logout, register } from '../lib/api/authApi';
import type { AuthAccount } from '../types';
import AuthPage from './auth/AuthPage';
import { renderAuthenticatedRoute, renderPublicRoute } from './app/routeRenderers';
import { resolveRestoredRoute } from './app/routeRestore';
import { shouldShowAuthPage } from './app/routeGuards';
// 中文：统一从 app/router 模块消费手写路由（类型 / 工厂 / hook）。
// English: consume the hand-rolled router (types / factories / hook) from app/router.
import {
  createHomeRoute,
  createLoginRoute,
  createRegisterRoute,
  useAppRouter,
  type AppRoute,
} from './app/router';

function App() {
  // 中文：route / 导航动作均来自 useAppRouter，App.tsx 不再直接触碰 history。
  // English: route state and navigation actions come from useAppRouter; App.tsx
  // no longer manipulates window.history directly.
  const { route, navigate, replace, goBack } = useAppRouter();
  const [account, setAccount] = useState<AuthAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [entryMessage, setEntryMessage] = useState<string | null>(null);

  const goBackOrReplace = (fallbackRoute: AppRoute) => {
    setEntryMessage(null);
    if (typeof window !== 'undefined' && window.history.length > 1) {
      goBack();
      return;
    }
    replace(fallbackRoute);
  };

  useEffect(() => {
    let cancelled = false;

    if (route.kind === 'publicShare') {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    fetchSession()
      .then((response) => {
        if (cancelled) {
          return;
        }

        const resolvedRoute = resolveRestoredRoute({ account: response.account, route });
        setAccount(response.account);
        setEntryMessage(resolvedRoute.entryMessage);
        replace(resolvedRoute.route);
      })
      .catch(() => {
        if (!cancelled) {
          setAccount(null);
          const nextRoute = route.kind === 'register' ? createRegisterRoute() : createLoginRoute();
          replace(nextRoute);
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
    // 中文：仅在挂载时恢复登录状态，沿用原有行为。
    // English: run only on mount to restore the session, preserving the original behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthenticated = (nextAccount: AuthAccount) => {
    setAccount(nextAccount);
    setEntryMessage(null);
    replace(createHomeRoute());
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
    handleLoggedOut();
  };

  const handleLoggedOut = () => {
    setAccount(null);
    setEntryMessage(null);
    replace(createLoginRoute());
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

  if (shouldShowAuthPage(account, route)) {
    return (
      <AuthPage
        mode={route.kind === 'register' ? 'register' : 'login'}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onNavigateLogin={() => navigate(createLoginRoute())}
        onNavigateRegister={() => navigate(createRegisterRoute())}
      />
    );
  }

  if (route.kind === 'publicShare') {
    return renderPublicRoute(route);
  }

  if (!account) {
    return null;
  }

  return renderAuthenticatedRoute({
    account,
    entryMessage,
    route,
    navigate,
    goBackOrReplace,
    setAccount,
    setEntryMessage,
    onLogout: handleLogout,
    onLoggedOut: handleLoggedOut,
  });
}

export default App;
