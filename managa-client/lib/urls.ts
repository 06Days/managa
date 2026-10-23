const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

/**
 * Rewrites app URLs that point at the container/host loopback address to the
 * hostname the dashboard was opened with. The managa server still uses
 * localhost internally for process health checks and app-to-app traffic.
 */
export function resolveAppUrl(
  raw: string | undefined,
  browserHostname: string | null,
): string | undefined {
  if (!raw || !browserHostname) return raw;
  if (LOOPBACK_HOSTS.has(browserHostname)) return raw;

  try {
    const url = new URL(raw);
    if (!LOOPBACK_HOSTS.has(url.hostname)) return raw;
    url.hostname = browserHostname;
    return url.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}
