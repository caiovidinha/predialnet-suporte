import { NextResponse } from 'next/server'
import { getIronSessionData } from '@/lib/session'
import { apiServer } from '@/lib/api'

async function requireAuth() {
  const session = await getIronSessionData()
  if (!session?.authenticated) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  return null
}

// GET /api/speedtest/results/:id
export async function GET(_req, { params }) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { id } = await params
  const res = await apiServer('GET', `/speedtest/results/${encodeURIComponent(id)}`)
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
