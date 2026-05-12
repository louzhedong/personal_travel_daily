import { vi } from 'vitest';

const appApiRouteMocks = vi.hoisted(() => ({
  getBootstrapPayloadMock: vi.fn(),
  getAdminOverviewMock: vi.fn(),
  listAdminAuditTrailMock: vi.fn(),
  recordAdminAuditLogMock: vi.fn(),
  repairAdminQualityIssueMock: vi.fn(),
  getStatsOverviewMock: vi.fn(),
  getAnnualReviewMock: vi.fn(),
  getAtlasTimelineMock: vi.fn(),
  listAccountMemoryCapsulesMock: vi.fn(),
  createAccountMemoryCapsuleMock: vi.fn(),
  getAccountMemoryCapsuleMock: vi.fn(),
  updateAccountMemoryCapsuleMock: vi.fn(),
  duplicateAccountMemoryCapsuleMock: vi.fn(),
  archiveAccountMemoryCapsuleMock: vi.fn(),
  getTripDetailMock: vi.fn(),
  updateTripPhotoCurationMock: vi.fn(),
  listPhotoCurationResourceMock: vi.fn(),
  updatePhotoCurationResourceMock: vi.fn(),
  listTripChecklistMock: vi.fn(),
  listTripPlanningMock: vi.fn(),
  createTripPlanningItemResourceMock: vi.fn(),
  createTripPlanningItemFromWishlistMock: vi.fn(),
  updateTripPlanningItemResourceMock: vi.fn(),
  deleteTripPlanningItemResourceMock: vi.fn(),
  convertTripPlanningItemToMarkerMock: vi.fn(),
  createTripChecklistItemResourceMock: vi.fn(),
  updateTripChecklistItemResourceMock: vi.fn(),
  deleteTripChecklistItemResourceMock: vi.fn(),
  generateTripChecklistMock: vi.fn(),
  createCompanionRecordMock: vi.fn(),
  updateCompanionRecordMock: vi.fn(),
  getCompanionMemoryMock: vi.fn(),
  refreshCompanionMemoryMock: vi.fn(),
  createMarkerRecordMock: vi.fn(),
  searchMarkerRecordsMock: vi.fn(),
  updateMarkerRecordMock: vi.fn(),
  batchUpdateMarkersTripMock: vi.fn(),
  deleteMarkerRecordMock: vi.fn(),
  listSavedGuidesResourceMock: vi.fn(),
  createSavedGuideResourceMock: vi.fn(),
  deleteSavedGuideResourceMock: vi.fn(),
  listGuideSearchHistoriesResourceMock: vi.fn(),
  createGuideSearchHistoryResourceMock: vi.fn(),
  createGuideSearchLogResourceMock: vi.fn(),
  listGuideSourceHealthResourceMock: vi.fn(),
  listWishlistItemsMock: vi.fn(),
  createWishlistItemResourceMock: vi.fn(),
  updateWishlistItemResourceMock: vi.fn(),
  convertWishlistItemToTripMock: vi.fn(),
  deleteWishlistItemResourceMock: vi.fn(),
  registerAccountMock: vi.fn(),
  loginAccountMock: vi.fn(),
  logoutAccountMock: vi.fn(),
  getAccountSettingsMock: vi.fn(),
  updateAccountProfileMock: vi.fn(),
  changeAccountPasswordMock: vi.fn(),
  listAccountSessionsMock: vi.fn(),
  revokeAccountSessionMock: vi.fn(),
  logoutAllAccountSessionsMock: vi.fn(),
  requireAuthenticatedAccountMock: vi.fn(),
  requireAdminAccountMock: vi.fn(),
  getAuthenticatedAccountMock: vi.fn(),
}));

vi.mock('../appApi/services/bootstrapService.js', () => ({
  getBootstrapPayload: appApiRouteMocks.getBootstrapPayloadMock,
}));

vi.mock('../appApi/services/adminService.js', () => ({
  getAdminOverview: appApiRouteMocks.getAdminOverviewMock,
}));

vi.mock('../appApi/services/adminAuditService.js', () => ({
  listAdminAuditTrail: appApiRouteMocks.listAdminAuditTrailMock,
  recordAdminAuditLog: appApiRouteMocks.recordAdminAuditLogMock,
}));

vi.mock('../appApi/services/adminQualityAutoFixService.js', () => ({
  repairAdminQualityIssue: appApiRouteMocks.repairAdminQualityIssueMock,
}));

vi.mock('../appApi/services/statsService.js', () => ({
  getStatsOverview: appApiRouteMocks.getStatsOverviewMock,
  getAnnualReview: appApiRouteMocks.getAnnualReviewMock,
}));

vi.mock('../appApi/services/atlasService.js', () => ({
  getAtlasTimeline: appApiRouteMocks.getAtlasTimelineMock,
}));

vi.mock('../appApi/services/memoryCapsuleService.js', () => ({
  listAccountMemoryCapsules: appApiRouteMocks.listAccountMemoryCapsulesMock,
  createAccountMemoryCapsule: appApiRouteMocks.createAccountMemoryCapsuleMock,
  getAccountMemoryCapsule: appApiRouteMocks.getAccountMemoryCapsuleMock,
  updateAccountMemoryCapsule: appApiRouteMocks.updateAccountMemoryCapsuleMock,
  duplicateAccountMemoryCapsule: appApiRouteMocks.duplicateAccountMemoryCapsuleMock,
  archiveAccountMemoryCapsule: appApiRouteMocks.archiveAccountMemoryCapsuleMock,
}));

vi.mock('../appApi/services/tripDetailService.js', () => ({
  getTripDetail: appApiRouteMocks.getTripDetailMock,
}));

vi.mock('../appApi/services/tripPhotoService.js', () => ({
  updateTripPhotoCuration: appApiRouteMocks.updateTripPhotoCurationMock,
}));

vi.mock('../appApi/services/photoCurationService.js', () => ({
  listPhotoCurationResource: appApiRouteMocks.listPhotoCurationResourceMock,
  updatePhotoCurationResource: appApiRouteMocks.updatePhotoCurationResourceMock,
}));

vi.mock('../appApi/services/tripChecklistService.js', () => ({
  listTripChecklist: appApiRouteMocks.listTripChecklistMock,
  createTripChecklistItemResource: appApiRouteMocks.createTripChecklistItemResourceMock,
  updateTripChecklistItemResource: appApiRouteMocks.updateTripChecklistItemResourceMock,
  deleteTripChecklistItemResource: appApiRouteMocks.deleteTripChecklistItemResourceMock,
  generateTripChecklist: appApiRouteMocks.generateTripChecklistMock,
}));

vi.mock('../appApi/services/tripPlanningService.js', () => ({
  listTripPlanning: appApiRouteMocks.listTripPlanningMock,
  createTripPlanningItemResource: appApiRouteMocks.createTripPlanningItemResourceMock,
  createTripPlanningItemFromWishlist: appApiRouteMocks.createTripPlanningItemFromWishlistMock,
  updateTripPlanningItemResource: appApiRouteMocks.updateTripPlanningItemResourceMock,
  deleteTripPlanningItemResource: appApiRouteMocks.deleteTripPlanningItemResourceMock,
  convertTripPlanningItemToMarker: appApiRouteMocks.convertTripPlanningItemToMarkerMock,
}));

vi.mock('../appApi/services/companionService.js', () => ({
  createCompanionRecord: appApiRouteMocks.createCompanionRecordMock,
  updateCompanionRecord: appApiRouteMocks.updateCompanionRecordMock,
}));

vi.mock('../appApi/services/companionMemoryService.js', () => ({
  getCompanionMemory: appApiRouteMocks.getCompanionMemoryMock,
  refreshCompanionMemory: appApiRouteMocks.refreshCompanionMemoryMock,
}));

vi.mock('../appApi/services/markerService.js', () => ({
  createMarkerRecord: appApiRouteMocks.createMarkerRecordMock,
  searchMarkerRecords: appApiRouteMocks.searchMarkerRecordsMock,
  updateMarkerRecord: appApiRouteMocks.updateMarkerRecordMock,
  batchUpdateMarkersTrip: appApiRouteMocks.batchUpdateMarkersTripMock,
  deleteMarkerRecord: appApiRouteMocks.deleteMarkerRecordMock,
}));

vi.mock('../appApi/services/savedGuideService.js', () => ({
  listSavedGuidesResource: appApiRouteMocks.listSavedGuidesResourceMock,
  createSavedGuideResource: appApiRouteMocks.createSavedGuideResourceMock,
  deleteSavedGuideResource: appApiRouteMocks.deleteSavedGuideResourceMock,
}));

vi.mock('../appApi/services/guideSearchHistoryService.js', () => ({
  listGuideSearchHistoriesResource: appApiRouteMocks.listGuideSearchHistoriesResourceMock,
  createGuideSearchHistoryResource: appApiRouteMocks.createGuideSearchHistoryResourceMock,
}));

vi.mock('../appApi/services/guideSearchLogService.js', () => ({
  createGuideSearchLogResource: appApiRouteMocks.createGuideSearchLogResourceMock,
}));

vi.mock('../appApi/services/guideSourceHealthService.js', () => ({
  listGuideSourceHealthResource: appApiRouteMocks.listGuideSourceHealthResourceMock,
}));

vi.mock('../appApi/services/wishlistService.js', () => ({
  listWishlistItems: appApiRouteMocks.listWishlistItemsMock,
  createWishlistItemResource: appApiRouteMocks.createWishlistItemResourceMock,
  updateWishlistItemResource: appApiRouteMocks.updateWishlistItemResourceMock,
  convertWishlistItemToTrip: appApiRouteMocks.convertWishlistItemToTripMock,
  deleteWishlistItemResource: appApiRouteMocks.deleteWishlistItemResourceMock,
}));

vi.mock('../appApi/services/authService.js', () => ({
  registerAccount: appApiRouteMocks.registerAccountMock,
  loginAccount: appApiRouteMocks.loginAccountMock,
  logoutAccount: appApiRouteMocks.logoutAccountMock,
}));

vi.mock('../appApi/services/accountSettingsService.js', () => ({
  getAccountSettings: appApiRouteMocks.getAccountSettingsMock,
  updateAccountProfile: appApiRouteMocks.updateAccountProfileMock,
  changeAccountPassword: appApiRouteMocks.changeAccountPasswordMock,
  listAccountSessions: appApiRouteMocks.listAccountSessionsMock,
  revokeAccountSession: appApiRouteMocks.revokeAccountSessionMock,
  logoutAllAccountSessions: appApiRouteMocks.logoutAllAccountSessionsMock,
}));

vi.mock('../appApi/auth/requestAuth.js', () => ({
  requireAuthenticatedAccount: appApiRouteMocks.requireAuthenticatedAccountMock,
  requireAdminAccount: appApiRouteMocks.requireAdminAccountMock,
  getAuthenticatedAccount: appApiRouteMocks.getAuthenticatedAccountMock,
}));

export function getAppApiRouteMocks() {
  return appApiRouteMocks;
}
