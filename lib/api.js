/**
 * Server-side helper to proxy requests to the Predialnet API
 * using the admin bypass token from environment variables.
 *
 * The token is NEVER exposed to the browser: client components call the
 * internal /api/* routes, which use this helper server-side.
 */
const API_BASE = process.env.API_BASE_URL

export async function apiServer(method, path, body = null) {
  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': process.env.ADMIN_BYPASS_TOKEN,
    },
    // No caching by default
    cache: 'no-store',
  }

  if (body !== null) {
    init.body = JSON.stringify(body)
  }

  const res = await fetch(`${API_BASE}${path}`, init)
  return res
}
