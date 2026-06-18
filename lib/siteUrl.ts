const DEFAULT_SITE_URL = "https://timeopen.app";

function isLocalhost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function getSiteUrl() {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");

  if (!configured) {
    return DEFAULT_SITE_URL;
  }

  try {
    const url = new URL(configured);

    if (isLocalhost(url.hostname) && process.env.NODE_ENV !== "development") {
      return DEFAULT_SITE_URL;
    }

    return configured;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function getBookingUrl(handle: string) {
  return `${getSiteUrl()}/u/${handle}`;
}
