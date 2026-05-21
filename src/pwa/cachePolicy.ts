export function canCacheRequest(method: string, path: string) {
  return method === 'GET' && !path.includes('/auth') && !path.includes('/password');
}
