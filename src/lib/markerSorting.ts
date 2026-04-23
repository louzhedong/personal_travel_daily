import type { VisitMarker } from '../types';

export function sortMarkersAsc(left: VisitMarker, right: VisitMarker) {
  return (
    left.visitedStartAt.localeCompare(right.visitedStartAt) ||
    left.visitedEndAt.localeCompare(right.visitedEndAt) ||
    left.createdAt.localeCompare(right.createdAt)
  );
}

export function sortMarkersDesc(left: VisitMarker, right: VisitMarker) {
  return (
    right.visitedStartAt.localeCompare(left.visitedStartAt) ||
    right.visitedEndAt.localeCompare(left.visitedEndAt) ||
    right.createdAt.localeCompare(left.createdAt)
  );
}
