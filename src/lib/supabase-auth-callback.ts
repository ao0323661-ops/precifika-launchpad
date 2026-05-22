import { toHashRoute } from "@/lib/hash-routes";
import { getPostAuthRedirect, type PostAuthRedirect } from "@/lib/post-auth-redirect";

const AUTH_REDIRECT_PARAM = "auth_redirect";
const AUTH_HASH_MARKERS = ["access_token=", "refresh_token=", "error=", "error_code=", "code="];

function getWindowUrl() {
  return new URL(window.location.href);
}

function getAuthRedirectTarget(value: string | null): PostAuthRedirect {
  return value === "/dashboard/pricing" ? value : "/dashboard";
}

function hasAuthCallbackParams(url: URL) {
  const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);

  return (
    url.searchParams.has("code") ||
    url.searchParams.has("error") ||
    hashParams.has("access_token") ||
    hashParams.has("refresh_token") ||
    hashParams.has("error") ||
    hashParams.has("error_code")
  );
}

function splitHashRouteAuthCallback(hash: string) {
  const hashBody = hash.startsWith("#") ? hash.slice(1) : hash;

  if (!hashBody.startsWith("/")) {
    return null;
  }

  const markerIndex = AUTH_HASH_MARKERS.reduce((lowest, marker) => {
    const index = hashBody.indexOf(marker);
    return index === -1 || (lowest !== -1 && index >= lowest) ? lowest : index;
  }, -1);

  if (markerIndex === -1) {
    return null;
  }

  const routeTarget = hashBody.slice(0, markerIndex).replace(/[?#&]+$/, "");
  const authParams = hashBody.slice(markerIndex).replace(/^[?#&]+/, "");

  return {
    target: getPostAuthRedirect(`redirect=${encodeURIComponent(routeTarget)}`),
    params: new URLSearchParams(authParams),
  };
}

export function normalizeSupabaseAuthCallbackUrl() {
  if (typeof window === "undefined") return;

  const url = getWindowUrl();
  const hashRouteCallback = splitHashRouteAuthCallback(url.hash);

  if (!hashRouteCallback) {
    return;
  }

  url.searchParams.set(AUTH_REDIRECT_PARAM, hashRouteCallback.target);

  if (hashRouteCallback.params.has("code") && !hashRouteCallback.params.has("access_token")) {
    hashRouteCallback.params.forEach((value, key) => url.searchParams.set(key, value));
    url.hash = "";
  } else {
    url.hash = `#${hashRouteCallback.params.toString()}`;
  }

  window.history.replaceState(window.history.state, "", url.toString());
}

export async function completeSupabaseAuthRedirect() {
  if (typeof window === "undefined") return;

  const url = getWindowUrl();
  const target = getAuthRedirectTarget(url.searchParams.get(AUTH_REDIRECT_PARAM));
  const shouldProcessCallback =
    url.searchParams.has(AUTH_REDIRECT_PARAM) || hasAuthCallbackParams(url);

  if (!shouldProcessCallback) {
    return;
  }

  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Erro ao processar callback de autenticação:", error);
    }

    window.history.replaceState(window.history.state, "", toHashRoute(session ? target : "/login"));
  } catch (error) {
    console.error("Não foi possível finalizar o callback de autenticação:", error);
    window.history.replaceState(window.history.state, "", toHashRoute("/login"));
  }
}
