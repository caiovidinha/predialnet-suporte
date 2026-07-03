/**
 * Server-side helper to proxy requests to the Predialnet API
 * using the admin bypass token from environment variables.
 *
 * The token is NEVER exposed to the browser: client components call the
 * internal /api/* routes, which use this helper server-side.
 */
import { NextResponse } from 'next/server'
import { getIronSessionData } from '@/lib/session'

const API_BASE = process.env.API_BASE_URL

/**
 * Guard para route handlers: devolve uma resposta 401 quando não há sessão,
 * ou `null` quando o operador está autenticado.
 */
export async function requireAuth() {
  const session = await getIronSessionData()
  if (!session?.authenticated) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  return null
}

/**
 * Encaminha uma chamada para a API Predialnet e devolve um NextResponse
 * preservando o status e o corpo JSON (com fallback para objeto vazio).
 */
export async function proxy(method, path, body = null) {
  const res = await apiServer(method, path, body)
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

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
