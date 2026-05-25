import cors from '@fastify/cors';
import Fastify from 'fastify';
import { getAppApiEnv } from './env.js';
import { normalizeAppApiError } from './errors.js';
import { registerArchiveMediaRoutes } from './routes/archiveMedia.js';
import { registerAssistantRoutes } from './routes/assistant.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerAccountSettingsRoutes } from './routes/accountSettings.js';
import { registerAtlasRoutes } from './routes/atlas.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerBootstrapRoutes } from './routes/bootstrap.js';
import { registerCompanionMemoryRoutes } from './routes/companionMemories.js';
import { registerCompanionRoutes } from './routes/companions.js';
import { registerContributionRoutes } from './routes/contribution.js';
import { registerExpenseRoutes } from './routes/expenses.js';
import { registerFinanceRoutes } from './routes/finance.js';
import { registerGuideSearchHistoryRoutes } from './routes/guideSearchHistories.js';
import { registerGuideSearchLogRoutes } from './routes/guideSearchLogs.js';
import { registerGuideSubscriptionRoutes } from './routes/guideSubscriptions.js';
import { registerGuideSourceHealthRoutes } from './routes/guideSourceHealth.js';
import { registerGeoRoutes } from './routes/geo.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerHomeDashboardRoutes } from './routes/homeDashboard.js';
import { registerJournalRoutes } from './routes/journal.js';
import { registerJourneyRoutes } from './routes/journey.js';
import { registerMarkerRoutes } from './routes/markers.js';
import { registerMapReplayStoryRoutes } from './routes/mapReplayStories.js';
import { registerMemoryCapsuleRoutes } from './routes/memoryCapsules.js';
import { registerOrganizationRoutes } from './routes/organization.js';
import { registerPhotoAlbumRoutes } from './routes/photoAlbums.js';
import { registerPhotoCurationRoutes } from './routes/photoCuration.js';
import { registerPlaceRoutes } from './routes/places.js';
import { registerRecallRoutes } from './routes/recall.js';
import { registerReminderRoutes } from './routes/reminders.js';
import { registerRhythmPortraitRoutes } from './routes/rhythmPortrait.js';
import { registerSavedGuideRoutes } from './routes/savedGuides.js';
import { registerShareDesignerRoutes } from './routes/shareDesigner.js';
import { registerShareLinkRoutes } from './routes/shareLinks.js';
import { registerStatsRoutes } from './routes/stats.js';
import { registerTagVocabularyRoutes } from './routes/tagVocabulary.js';
import { registerTripRoutes } from './routes/trips.js';
import { registerTripReconciliationRoutes } from './routes/tripReconciliation.js';
import { registerWishlistRoutes } from './routes/wishlist.js';
import { registerWishlistMoodRoutes } from './routes/wishlistMood.js';

export async function buildApp() {
  const env = getAppApiEnv();
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: env.APP_API_CORS_ORIGIN === '*' ? true : env.APP_API_CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await registerAuthRoutes(app);
  await registerAccountSettingsRoutes(app);
  await registerArchiveMediaRoutes(app);
  await registerAssistantRoutes(app);
  await registerAdminRoutes(app);
  await registerHealthRoutes(app);
  await registerHomeDashboardRoutes(app);
  await registerBootstrapRoutes(app);
  await registerCompanionRoutes(app);
  await registerCompanionMemoryRoutes(app);
  await registerTripRoutes(app);
  await registerExpenseRoutes(app);
  await registerFinanceRoutes(app);
  await registerJournalRoutes(app);
  await registerPlaceRoutes(app);
  await registerShareDesignerRoutes(app);
  await registerWishlistRoutes(app);
  await registerAtlasRoutes(app);
  await registerMapReplayStoryRoutes(app);
  await registerStatsRoutes(app);
  await registerTagVocabularyRoutes(app);
  await registerMemoryCapsuleRoutes(app);
  await registerOrganizationRoutes(app);
  await registerPhotoAlbumRoutes(app);
  await registerPhotoCurationRoutes(app);
  await registerReminderRoutes(app);
  await registerSavedGuideRoutes(app);
  await registerShareLinkRoutes(app);
  await registerGuideSearchHistoryRoutes(app);
  await registerGuideSearchLogRoutes(app);
  await registerGuideSubscriptionRoutes(app);
  await registerGuideSourceHealthRoutes(app);
  await registerGeoRoutes(app);
  await registerJourneyRoutes(app);
  await registerMarkerRoutes(app);
  await registerContributionRoutes(app);
  await registerRecallRoutes(app);
  await registerRhythmPortraitRoutes(app);
  await registerTripReconciliationRoutes(app);
  await registerWishlistMoodRoutes(app);

  app.setErrorHandler((error, _request, reply) => {
    const normalizedError = normalizeAppApiError(error);
    app.log.error(error);

    reply.status(normalizedError.statusCode).send({
      error: {
        code: normalizedError.code,
        message: normalizedError.message,
      },
    });
  });

  return app;
}
