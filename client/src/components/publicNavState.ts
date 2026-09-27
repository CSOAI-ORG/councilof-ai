/** Match public navigation paths without trailing-slash or prefix collisions. */
export function isPublicNavActive(location: string, href: string): boolean {
  const path = href.split(/[?#]/)[0].replace(/\/+$/, '');
  const current = location.split(/[?#]/)[0].replace(/\/+$/, '');
  if (!path || !path.startsWith('/')) return false;
  return current === path || current.startsWith(path + '/');
}
