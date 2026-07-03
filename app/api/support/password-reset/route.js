import { NextResponse } from 'next/server'
import { requireAuth, proxy } from '@/lib/api'

// POST /api/support/password-reset  body: { cpf, sendEmail? }
export async function POST(req) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const body = await req.json().catch(() => ({}))
  const cpf = String(body?.cpf || '').replace(/\D/g, '')
  if (cpf.length !== 11) {
    return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
  }
  const sendEmail = body?.sendEmail === true

  return proxy('POST', `/support/clients/${cpf}/password-reset`, { sendEmail })
}
