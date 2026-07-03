import { NextResponse } from 'next/server'
import { requireAuth, proxy } from '@/lib/api'

// GET /api/support/notifications?cpf=<cpf>  → push recebidas pelo cliente no app
export async function GET(req) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const cpf = (searchParams.get('cpf') || '').replace(/\D/g, '')
  if (cpf.length !== 11) {
    return NextResponse.json({ error: 'CPF inválido. Informe 11 dígitos.' }, { status: 400 })
  }

  return proxy('GET', `/support/clients/${cpf}/notifications`)
}
