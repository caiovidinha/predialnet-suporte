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

// GET /api/speedtest/summary?cpf=<cpf>
export async function GET(req) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const cpf = (searchParams.get('cpf') || '').replace(/\D/g, '')
  if (cpf.length !== 11) {
    return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
  }

  const res = await apiServer('GET', `/speedtest/clients/${cpf}/summary`)
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
