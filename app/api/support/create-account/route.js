import { NextResponse } from 'next/server'
import { requireAuth, proxy } from '@/lib/api'

// POST /api/support/create-account  body: { cpf, email }  (email = censurado do passo de e-mails)
export async function POST(req) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const body = await req.json().catch(() => ({}))
  const cpf = String(body?.cpf || '').replace(/\D/g, '')
  const email = String(body?.email || '').trim()
  if (cpf.length !== 11) {
    return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
  }
  if (!email) {
    return NextResponse.json({ error: 'Selecione um e-mail.' }, { status: 400 })
  }

  return proxy('POST', '/support/clients/create-account', { cpf, email })
}
