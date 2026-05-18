import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { AuthAccount } from '../../types';
import AdminPage from '../admin/AdminPage';
import AchievementsPage from '../achievements/AchievementsPage';
import TravelAtlasPage from '../atlas/TravelAtlasPage';
import MemoryCapsuleCenterPage from '../capsules/MemoryCapsuleCenterPage';
import MemoryCapsuleDetailPage from '../capsules/MemoryCapsuleDetailPage';
import CompanionMemoriesPage from '../companions/CompanionMemoriesPage';
import OrganizationWorkbenchPage from '../organize/OrganizationWorkbenchPage';
import TagGovernancePage from '../tag-governance/TagGovernancePage';
import PhotoCurationPage from '../photos/PhotoCurationPage';
import PublicSharePage from '../share/PublicSharePage';
import ReminderCenterPage from '../reminders/ReminderCenterPage';
import MapReplayStoryPage from '../replay/MapReplayStoryPage';
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
  createMapReplayStoryRoute,
  createOrganizeRoute,
  createPhotoCurationRoute,
  createRemindersRoute,
  createSettingsRoute,
  createStatsRoute,
  createTagGovernanceRoute,
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

type RegisteredAuthenticatedRoute = Exclude<
  AppRoute,
  { kind: 'home' } | { kind: 'login' } | { kind: 'register' } | { kind: 'publicShare' }
>;

type RouteRenderer<K extends RegisteredAuthenticatedRoute['kind']> = (
  props: AuthenticatedRouteRendererProps & { route: Extract<RegisteredAuthenticatedRoute, { kind: K }> },
) => ReactNode;

type RouteRendererRegistry = {
  [K in RegisteredAuthenticatedRoute['kind']]: RouteRenderer<K>;
};

const authenticatedRouteRenderers: RouteRendererRegistry = {
  admin: ({ account, navigate, goBackOrReplace, setEntryMessage, onLogout }) => (
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
  ),
  settings: ({ account, goBackOrReplace, setAccount, onLogout, onLoggedOut }) => (
    <AccountSettingsPage
      account={account}
      onAccountUpdated={setAccount}
      onLogout={onLogout}
      onLoggedOut={onLoggedOut}
      onNavigateBack={() => goBackOrReplace(createHomeRoute())}
    />
  ),
  atlas: ({ account, goBackOrReplace, onLogout }) => (
    <TravelAtlasPage account={account} onLogout={onLogout} onNavigateBack={() => goBackOrReplace(createHomeRoute())} />
  ),
  organize: ({ account, goBackOrReplace, onLogout }) => (
    <OrganizationWorkbenchPage
      account={account}
      onLogout={onLogout}
      onNavigateBack={() => goBackOrReplace(createHomeRoute())}
    />
  ),
  tagGovernance: ({ account, goBackOrReplace, onLogout }) => (
    <TagGovernancePage account={account} onLogout={onLogout} onNavigateBack={() => goBackOrReplace(createHomeRoute())} />
  ),
  tripDetail: ({ account, route, navigate, goBackOrReplace, onLogout }) => (
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
  ),
  tripStory: ({ account, route, navigate, goBackOrReplace, onLogout }) => (
    <TripStoryPage
      account={account}
      tripId={route.tripId}
      onLogout={onLogout}
      onNavigateBack={() => goBackOrReplace(createTripDetailRoute(route.tripId))}
      onOpenPhotoCuration={(query) => navigate(createPhotoCurationRoute(query))}
      onOpenMapReplayStory={(tripId) => navigate(createMapReplayStoryRoute('trip', tripId))}
    />
  ),
  mapReplayStory: ({ account, route, goBackOrReplace, onLogout }) => (
    <MapReplayStoryPage
      account={account}
      targetType={route.targetType}
      targetId={route.targetId}
      onLogout={onLogout}
      onNavigateBack={() => goBackOrReplace(createHomeRoute())}
    />
  ),
  tripChecklist: ({ account, route, goBackOrReplace, onLogout }) => (
    <TripChecklistPage
      account={account}
      tripId={route.tripId}
      onLogout={onLogout}
      onNavigateBack={() => goBackOrReplace(createTripDetailRoute(route.tripId))}
    />
  ),
  annualReview: ({ account, route, navigate, goBackOrReplace, onLogout }) => (
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
  ),
  achievements: ({ account, goBackOrReplace, onLogout }) => (
    <AchievementsPage account={account} onLogout={onLogout} onNavigateBack={() => goBackOrReplace(createStatsRoute())} />
  ),
  memoryCapsules: ({ account, navigate, goBackOrReplace, onLogout }) => (
    <MemoryCapsuleCenterPage
      account={account}
      onLogout={onLogout}
      onNavigateBack={() => goBackOrReplace(createHomeRoute())}
      onOpenCapsule={(capsuleId) => navigate(createMemoryCapsuleDetailRoute(capsuleId))}
    />
  ),
  reminders: ({ account, navigate, goBackOrReplace, onLogout }) => (
    <ReminderCenterPage
      account={account}
      onLogout={onLogout}
      onNavigateBack={() => goBackOrReplace(createHomeRoute())}
      onNavigateToPath={(path) => {
        const [pathname, search = ''] = path.split('?');
        navigate(parsePathname(pathname, search ? `?${search}` : ''));
      }}
    />
  ),
  memoryCapsuleDetail: ({ account, route, navigate, goBackOrReplace, onLogout }) => (
    <MemoryCapsuleDetailPage
      account={account}
      capsuleId={route.capsuleId}
      onLogout={onLogout}
      onNavigateBack={() => goBackOrReplace(createMemoryCapsulesRoute())}
      onOpenMapReplayStory={(targetType, targetId) => navigate(createMapReplayStoryRoute(targetType, targetId))}
    />
  ),
  companionMemories: ({ account, route, navigate, goBackOrReplace, onLogout }) => (
    <CompanionMemoriesPage
      account={account}
      companionId={route.companionId}
      onLogout={onLogout}
      onNavigateBack={() => goBackOrReplace(createStatsRoute())}
      onOpenMemoryCapsules={() => navigate(createMemoryCapsulesRoute())}
    />
  ),
  photoCuration: ({ account, route, goBackOrReplace, onLogout }) => (
    <PhotoCurationPage
      account={account}
      initialQuery={route.query}
      onLogout={onLogout}
      onNavigateBack={() => goBackOrReplace(createHomeRoute())}
    />
  ),
  stats: ({ account, navigate, goBackOrReplace, setEntryMessage, onLogout }) => (
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
  ),
};

function isRegisteredAuthenticatedRoute(route: AppRoute): route is RegisteredAuthenticatedRoute {
  return route.kind in authenticatedRouteRenderers;
}

function renderRegisteredRoute(props: AuthenticatedRouteRendererProps & { route: RegisteredAuthenticatedRoute }) {
  const renderer = authenticatedRouteRenderers[props.route.kind] as (input: typeof props) => ReactNode;
  return renderer(props);
}

function renderHomeRoute({
  account,
  entryMessage,
  navigate,
  setEntryMessage,
  onLogout,
}: AuthenticatedRouteRendererProps) {
  return (
    <TravelApp
      account={account}
      onLogout={onLogout}
      onOpenStats={() => navigate(createStatsRoute())}
      onOpenAtlas={() => navigate(createAtlasRoute())}
      onOpenOrganize={() => navigate(createOrganizeRoute())}
      onOpenTagGovernance={() => navigate(createTagGovernanceRoute())}
      onOpenTripDetail={(tripId) => navigate(createTripDetailRoute(tripId))}
      onOpenTripChecklist={(tripId) => navigate(createTripChecklistRoute(tripId))}
      onOpenPhotoCuration={() => navigate(createPhotoCurationRoute())}
      onOpenMemoryCapsules={() => navigate(createMemoryCapsulesRoute())}
      onOpenReminders={() => navigate(createRemindersRoute())}
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

export function renderAuthenticatedRoute(props: AuthenticatedRouteRendererProps) {
  if (isRegisteredAuthenticatedRoute(props.route)) {
    return renderRegisteredRoute({ ...props, route: props.route });
  }

  return renderHomeRoute(props);
}

export function renderPublicRoute(route: Extract<AppRoute, { kind: 'publicShare' }>) {
  return <PublicSharePage token={route.token} />;
}
