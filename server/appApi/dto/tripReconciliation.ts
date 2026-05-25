/**
 * G2 · Trip Reconciliation DTOs / 旅行对账日 DTO
 */
export interface TripReconciliationReportDto {
  id: string;
  tripId: string;
  tripName: string;
  generatedAt: string;
  planVsMarkerCoverage: number;
  checklistCompletionRate: number;
  budgetVarianceCents: number;
  budgetPlannedCents: number;
  budgetActualCents: number;
  baseCurrency: string;
  unconvertedPlanningItems: Array<{
    id: string;
    title: string;
    plannedDate: string | null;
  }>;
  missingCaptionPhotoCount: number;
  totalPhotoCount: number;
  totalMarkerCount: number;
  totalChecklistCount: number;
  completedChecklistCount: number;
  totalPlanningCount: number;
  convertedPlanningCount: number;
  summaryMarkdown: string;
  acknowledgedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripReconciliationActionResponseDto {
  report: TripReconciliationReportDto;
}
