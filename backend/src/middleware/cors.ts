const ALLOWED_ORIGINS = [
  "https://lucasdelevy.github.io",
  "http://localhost:5173",
  "http://localhost:8081", // Expo dev server (web preview)
];

/**
 * Browser clients require CORS headers. Native iOS/Android apps using fetch()
 * do not send an Origin header, so API Gateway responses omit CORS — which
 * is fine because native runtimes enforce same-origin differently (they don't).
 */
export function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json",
  };
}
