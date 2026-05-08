import { useEffect, useState } from 'react';
import { fetchSession, login, logout, register } from '../lib/api/authApi';
import type { AuthAccount } from '../types';
import AdminPage from './admin/AdminPage';
import AchievementsPage from './achievements/AchievementsPage';
import AuthPage from './auth/AuthPage';
import CompanionMemoriesPage from './companions/CompanionMemoriesPage';
import TravelApp from './TravelApp';
import StatsPage from './stats/StatsPage';
import TripDetailPage from './trips/TripDetailPage';
import TripStoryPage from './trips/TripStoryPage';
import AnnualReviewPage from './yearbook/AnnualReviewPage';
// 中文：统一从 app/router 模块消费手写路由（类型 / 工厂 / hook）。
// English: consume the hand-rolled router (types / factories / hook) from app/router.
import {
  createAdminRoute,
  createAchievementsRoute,
  createAnnualReviewRoute,
  createCompanionMemoriesRoute,
  createHomeRoute,
  createLoginRoute,
  createRegisterRoute,
  createStatsRoute,
  createTripChecklistRoute,
  createTripDetailRoute,
  createTripStoryRoute,
  useAppRouter,
  type AppRoute,
} from './app/router';
import TripChecklistPage from './trips/TripChecklistPage';

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
        } else if (route.kind === 'tripStory') {
          nextRoute = createTripStoryRoute(route.tripId);
        } else if (route.kind === 'tripChecklist') {
          nextRoute = createTripChecklistRoute(route.tripId);
        } else if (route.kind === 'annualReview') {
          nextRoute = createAnnualReviewRoute(route.year);
        } else if (route.kind === 'achievements') {
          nextRoute = createAchievementsRoute();
        } else if (route.kind === 'companionMemories') {
          nextRoute = createCompanionMemoriesRoute(route.companionId);
        } else if (route.kind === 'stats') {
          nextRoute = createStatsRoute();
        } else {
          nextRoute = createHomeRoute();
        }
        replace(nextRoute);
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
    // English: run only on mount to restore the session, preserving the original behaviour.
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

  if (!account || route.kind === 'login' || route.kind === 'register') {
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

  if (route.kind === 'admin') {
    return (
      <AdminPage
        account={account}
        onLogout={handleLogout}
        onNavigateHome={() => {
          setEntryMessage(null);
          goBackOrReplace(createHomeRoute());
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
        onNavigateBack={() => goBackOrReplace(createStatsRoute())}
        onOpenTripChecklist={(tripId) => navigate(createTripChecklistRoute(tripId))}
        onOpenTripStory={(tripId) => navigate(createTripStoryRoute(tripId))}
        onOpenCompanionMemories={(companionId) => navigate(createCompanionMemoriesRoute(companionId))}
      />
    );
  }

  if (route.kind === 'tripStory') {
    return (
      <TripStoryPage
        account={account}
        tripId={route.tripId}
        onLogout={handleLogout}
        onNavigateBack={() => goBackOrReplace(createTripDetailRoute(route.tripId))}
      />
    );
  }

  if (route.kind === 'tripChecklist') {
    return (
      <TripChecklistPage
        account={account}
        tripId={route.tripId}
        onLogout={handleLogout}
        onNavigateBack={() => goBackOrReplace(createTripDetailRoute(route.tripId))}
      />
    );
  }

  if (route.kind === 'annualReview') {
    return (
      <AnnualReviewPage
        account={account}
        year={route.year}
        onLogout={handleLogout}
        onNavigateBack={() => goBackOrReplace(createStatsRoute())}
        onOpenTripDetail={(tripId) => navigate(createTripDetailRoute(tripId))}
        onOpenAchievements={() => navigate(createAchievementsRoute())}
      />
    );
  }

  if (route.kind === 'achievements') {
    return (
      <AchievementsPage
        account={account}
        onLogout={handleLogout}
        onNavigateBack={() => goBackOrReplace(createStatsRoute())}
      />
    );
  }

  if (route.kind === 'companionMemories') {
    return (
      <CompanionMemoriesPage
        account={account}
        companionId={route.companionId}
        onLogout={handleLogout}
        onNavigateBack={() => goBackOrReplace(createStatsRoute())}
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
          goBackOrReplace(createHomeRoute());
        }}
        onOpenTripDetail={(tripId) => navigate(createTripDetailRoute(tripId))}
        onOpenAnnualReview={(year) => navigate(createAnnualReviewRoute(year))}
        onOpenAchievements={() => navigate(createAchievementsRoute())}
        onOpenCompanionMemories={(companionId) => navigate(createCompanionMemoriesRoute(companionId))}
      />
    );
  }

  return (
    <TravelApp
      account={account}
      onLogout={handleLogout}
      onOpenStats={() => navigate(createStatsRoute())}
      onOpenTripDetail={(tripId) => navigate(createTripDetailRoute(tripId))}
      onOpenTripChecklist={(tripId) => navigate(createTripChecklistRoute(tripId))}
      onOpenAdmin={
        account.role === 'admin'
          ? () => {
              setEntryMessage(null);
              navigate(createAdminRoute());
            }
          : undefined
      }
      entryMessage={entryMessage}
    />
  );
}

export default App;
