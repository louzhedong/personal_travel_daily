import type { Dispatch, SetStateAction } from 'react';
import type { AuthAccount } from '../../types';
import AdminPage from '../admin/AdminPage';
import AchievementsPage from '../achievements/AchievementsPage';
import TravelAtlasPage from '../atlas/TravelAtlasPage';
import MemoryCapsuleCenterPage from '../capsules/MemoryCapsuleCenterPage';
import MemoryCapsuleDetailPage from '../capsules/MemoryCapsuleDetailPage';
import CompanionMemoriesPage from '../companions/CompanionMemoriesPage';
import PhotoCurationPage from '../photos/PhotoCurationPage';
import AccountSettingsPage from '../settings/AccountSettingsPage';
import StatsPage from '../stats/StatsPage';
import TravelApp from '../TravelApp';
import TripChecklistPage from '../trips/TripChecklistPage';
import TripDetailPage from '../trips/TripDetailPage';
import TripStoryPage from '../trips/TripStoryPage';
import AnnualReviewPage from '../yearbook/AnnualReviewPage';
import { canOpenAdmin } from './routeGuards';
import {
  createAdminRoute,
  createAchievementsRoute,
  createAtlasRoute,
  createAnnualReviewRoute,
  createCompanionMemoriesRoute,
  createHomeRoute,
  createMemoryCapsuleDetailRoute,
  createMemoryCapsulesRoute,
  createPhotoCurationRoute,
  createSettingsRoute,
  createStatsRoute,
  createTripChecklistRoute,
  createTripDetailRoute,
  createTripStoryRoute,
  parsePathname,
  type AppRoute,
} from './router';

interface AuthenticatedRouteRendererProps {
  account: AuthAccount;
  entryMessage: string | null;
  route: AppRoute;
  navigate: (route: AppRoute) => void;
  goBackOrReplace: (fallbackRoute: AppRoute) => void;
  setAccount: Dispatch<SetStateAction<AuthAccount | null>>;
  setEntryMessage: Dispatch<SetStateAction<string | null>>;
  onLogout: () => Promise<void>;
  onLoggedOut: () => void;
}

export function renderAuthenticatedRoute({
  account,
  entryMessage,
  route,
  navigate,
  goBackOrReplace,
  setAccount,
  setEntryMessage,
  onLogout,
  onLoggedOut,
}: AuthenticatedRouteRendererProps) {
  if (route.kind === 'admin') {
    return (
      <AdminPage
        account={account}
        onLogout={onLogout}
        onNavigateHome={() => {
          setEntryMessage(null);
          goBackOrReplace(createHomeRoute());
        }}
        onNavigateToPath={(path) => {
          const [pathname, search = ''] = path.split('?');
          navigate(parsePathname(pathname, search ? `?${search}` : ''));
        }}
      />
    );
  }

  if (route.kind === 'settings') {
    return (
      <AccountSettingsPage
        account={account}
        onAccountUpdated={setAccount}
        onLogout={onLogout}
        onLoggedOut={onLoggedOut}
        onNavigateBack={() => goBackOrReplace(createHomeRoute())}
      />
    );
  }

  if (route.kind === 'atlas') {
    return (
      <TravelAtlasPage
        account={account}
        onLogout={onLogout}
        onNavigateBack={() => goBackOrReplace(createHomeRoute())}
      />
    );
  }

  if (route.kind === 'tripDetail') {
    return (
      <TripDetailPage
        account={account}
        tripId={route.tripId}
        onLogout={onLogout}
        onNavigateBack={() => goBackOrReplace(createStatsRoute())}
        onOpenTripChecklist={(tripId) => navigate(createTripChecklistRoute(tripId))}
        onOpenTripStory={(tripId) => navigate(createTripStoryRoute(tripId))}
        onOpenMemoryCapsules={() => navigate(createMemoryCapsulesRoute())}
        onOpenCompanionMemories={(companionId) => navigate(createCompanionMemoriesRoute(companionId))}
        onOpenPhotoCuration={(query) => navigate(createPhotoCurationRoute(query))}
      />
    );
  }

  if (route.kind === 'tripStory') {
    return (
      <TripStoryPage
        account={account}
        tripId={route.tripId}
        onLogout={onLogout}
        onNavigateBack={() => goBackOrReplace(createTripDetailRoute(route.tripId))}
        onOpenPhotoCuration={(query) => navigate(createPhotoCurationRoute(query))}
      />
    );
  }

  if (route.kind === 'tripChecklist') {
    return (
      <TripChecklistPage
        account={account}
        tripId={route.tripId}
        onLogout={onLogout}
        onNavigateBack={() => goBackOrReplace(createTripDetailRoute(route.tripId))}
      />
    );
  }

  if (route.kind === 'annualReview') {
    return (
      <AnnualReviewPage
        account={account}
        year={route.year}
        onLogout={onLogout}
        onNavigateBack={() => goBackOrReplace(createStatsRoute())}
        onOpenTripDetail={(tripId) => navigate(createTripDetailRoute(tripId))}
        onOpenAchievements={() => navigate(createAchievementsRoute())}
        onOpenPhotoCuration={(query) => navigate(createPhotoCurationRoute(query))}
        onOpenMemoryCapsules={() => navigate(createMemoryCapsulesRoute())}
      />
    );
  }

  if (route.kind === 'achievements') {
    return <AchievementsPage account={account} onLogout={onLogout} onNavigateBack={() => goBackOrReplace(createStatsRoute())} />;
  }

  if (route.kind === 'memoryCapsules') {
    return (
      <MemoryCapsuleCenterPage
        account={account}
        onLogout={onLogout}
        onNavigateBack={() => goBackOrReplace(createHomeRoute())}
        onOpenCapsule={(capsuleId) => navigate(createMemoryCapsuleDetailRoute(capsuleId))}
      />
    );
  }

  if (route.kind === 'memoryCapsuleDetail') {
    return (
      <MemoryCapsuleDetailPage
        account={account}
        capsuleId={route.capsuleId}
        onLogout={onLogout}
        onNavigateBack={() => goBackOrReplace(createMemoryCapsulesRoute())}
      />
    );
  }

  if (route.kind === 'companionMemories') {
    return (
      <CompanionMemoriesPage
        account={account}
        companionId={route.companionId}
        onLogout={onLogout}
        onNavigateBack={() => goBackOrReplace(createStatsRoute())}
        onOpenMemoryCapsules={() => navigate(createMemoryCapsulesRoute())}
      />
    );
  }

  if (route.kind === 'photoCuration') {
    return (
      <PhotoCurationPage
        account={account}
        initialQuery={route.query}
        onLogout={onLogout}
        onNavigateBack={() => goBackOrReplace(createHomeRoute())}
      />
    );
  }

  if (route.kind === 'stats') {
    return (
      <StatsPage
        account={account}
        onLogout={onLogout}
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
      onLogout={onLogout}
      onOpenStats={() => navigate(createStatsRoute())}
      onOpenAtlas={() => navigate(createAtlasRoute())}
      onOpenTripDetail={(tripId) => navigate(createTripDetailRoute(tripId))}
      onOpenTripChecklist={(tripId) => navigate(createTripChecklistRoute(tripId))}
      onOpenPhotoCuration={() => navigate(createPhotoCurationRoute())}
      onOpenMemoryCapsules={() => navigate(createMemoryCapsulesRoute())}
      onOpenSettings={() => navigate(createSettingsRoute())}
      onOpenAdmin={
        canOpenAdmin(account)
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
