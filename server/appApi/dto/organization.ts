export type OrganizationIssueKindDto =
  | 'unassignedMarker'
  | 'missingPhotoCaption'
  | 'unlinkedGuide'
  | 'unfeaturedPhoto'
  | 'weakMarkerTags';

export type OrganizationActionTypeDto =
  | 'assignMarkersToTrip'
  | 'addTagsToMarkers'
  | 'featurePhotos'
  | 'draftPhotoCaptions';

export interface OrganizationTripOptionDto {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
}

export interface OrganizationIssueDto {
  id: string;
  kind: OrganizationIssueKindDto;
  targetId: string;
  title: string;
  description: string;
  actionHint: string;
  occurredAt?: string;
  tripId?: string;
  tripName?: string;
  markerId?: string;
  markerTitle?: string;
  imageUrl?: string;
  guideSourceName?: string;
  tags?: string[];
}

export interface OrganizationWorkbenchSummaryDto {
  totalIssues: number;
  unassignedMarkers: number;
  missingPhotoCaptions: number;
  unlinkedGuides: number;
  unfeaturedPhotos: number;
  weakMarkerTags: number;
  readyTrips: number;
}

export interface OrganizationWorkbenchResponseDto {
  summary: OrganizationWorkbenchSummaryDto;
  tripOptions: OrganizationTripOptionDto[];
  sections: {
    unassignedMarkers: OrganizationIssueDto[];
    missingPhotoCaptions: OrganizationIssueDto[];
    unlinkedGuides: OrganizationIssueDto[];
    unfeaturedPhotos: OrganizationIssueDto[];
    weakMarkerTags: OrganizationIssueDto[];
  };
  generatedAt: string;
}

export interface AssignMarkersToTripActionDto {
  type: 'assignMarkersToTrip';
  markerIds: string[];
  tripId: string;
}

export interface AddTagsToMarkersActionDto {
  type: 'addTagsToMarkers';
  markerIds: string[];
  tags: string[];
}

export interface FeaturePhotosActionDto {
  type: 'featurePhotos';
  imageIds: string[];
}

export interface DraftPhotoCaptionsActionDto {
  type: 'draftPhotoCaptions';
  imageIds: string[];
}

export type OrganizationActionInputDto =
  | AssignMarkersToTripActionDto
  | AddTagsToMarkersActionDto
  | FeaturePhotosActionDto
  | DraftPhotoCaptionsActionDto;

export interface OrganizationActionPreviewChangeDto {
  targetId: string;
  targetTitle: string;
  before: string;
  after: string;
}

export interface OrganizationActionPreviewDto {
  actionType: OrganizationActionTypeDto;
  dryRun: boolean;
  changeCount: number;
  changes: OrganizationActionPreviewChangeDto[];
}

export interface OrganizationActionResultDto extends OrganizationActionPreviewDto {
  applied: boolean;
  workbench: OrganizationWorkbenchResponseDto;
}

