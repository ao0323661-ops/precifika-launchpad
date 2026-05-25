const DEFAULT_PUBLIC_APP_URL = "https://precifika-launchpad.lovable.app";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function normalizePublicAppUrl(value?: string) {
  const candidate = value?.trim() || DEFAULT_PUBLIC_APP_URL;
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;

  try {
    const url = new URL(withProtocol);

    if (LOCAL_HOSTNAMES.has(url.hostname) || url.hostname.endsWith(".localhost")) {
      return DEFAULT_PUBLIC_APP_URL;
    }

    return url.origin;
  } catch {
    return DEFAULT_PUBLIC_APP_URL;
  }
}

export const PUBLIC_APP_URL = normalizePublicAppUrl(import.meta.env.VITE_PUBLIC_APP_URL);

export function toPublicHashRoute(path: string) {
  const url = new URL(PUBLIC_APP_URL);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  url.hash = normalizedPath;
  return url.toString();
}

export function toPublicAuthRedirectRoute(path: string) {
  const url = new URL(PUBLIC_APP_URL);
  url.searchParams.set("auth_redirect", path);
  return url.toString();
}
