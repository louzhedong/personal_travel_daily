import { getResourceBaseUrl, httpClient } from './httpClient';
import type {
  OrganizationActionInputDto,
  OrganizationActionPreviewDto,
  OrganizationActionResultDto,
  OrganizationWorkbenchResponseDto,
} from './types';

const BASE_URL = getResourceBaseUrl();

export async function fetchOrganizationWorkbench() {
  return httpClient.get<OrganizationWorkbenchResponseDto>(BASE_URL, '/organization/workbench');
}

export async function previewOrganizationAction(input: OrganizationActionInputDto) {
  return httpClient.post<OrganizationActionPreviewDto>(BASE_URL, '/organization/actions/preview', input);
}

export async function applyOrganizationAction(input: OrganizationActionInputDto) {
  return httpClient.post<OrganizationActionResultDto>(BASE_URL, '/organization/actions/apply', input);
}

