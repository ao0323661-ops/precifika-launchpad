export type PostAuthRedirect = "/dashboard" | "/dashboard/pricing";

const DEFAULT_POST_AUTH_REDIRECT: PostAuthRedirect = "/dashboard";

export function getPostAuthRedirect(searchStr?: string | null): PostAuthRedirect {
  const normalizedSearch = searchStr?.startsWith("?") ? searchStr.slice(1) : searchStr || "";
  const redirect = new URLSearchParams(normalizedSearch).get("redirect");

  if (redirect === "/dashboard/pricing") {
    return redirect;
  }

  return DEFAULT_POST_AUTH_REDIRECT;
}

export function withPostAuthRedirect(path: "/login" | "/signup", redirect: PostAuthRedirect) {
  if (redirect === DEFAULT_POST_AUTH_REDIRECT) {
    return path;
  }

  return `${path}?redirect=${encodeURIComponent(redirect)}`;
}
