export function formatDateRange(startAt: string, endAt: string) {
  return startAt === endAt ? startAt : `${startAt} - ${endAt}`;
}

export function formatVisitedRange(input: { visitedStartAt: string; visitedEndAt: string }) {
  return formatDateRange(input.visitedStartAt, input.visitedEndAt);
}

export function getDateOnlyYear(value: string) {
  return value.slice(0, 4);
}

export function getTripDays(startAt: string, endAt: string) {
  if (!startAt || !endAt || endAt < startAt) {
    return null;
  }

  const start = new Date(`${startAt}T00:00:00`);
  const end = new Date(`${endAt}T00:00:00`);
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

export function getTodayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}
