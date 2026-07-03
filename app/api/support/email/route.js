import { NextResponse } from 'next/server'
import { requireAuth, proxy } from '@/lib/api'

// GET /api/support/email?cpf=<cpf>  → e-mail da conta do app (User.email)
export async function GET(req) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const cpf = (searchParams.get('cpf') || '').replace(/\D/g, '')
  if (cpf.length !== 11) {
    return NextResponse.json({ error: 'CPF inválido. Informe 11 dígitos.' }, { status: 400 })
  }

  return proxy('GET', `/support/clients/${cpf}/email`)
}

// PUT /api/support/email  body: { cpf, email, codcliente }  → altera o e-mail
// da conta do app e do contrato informado na Predialnet.
export async function PUT(req) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const body = await req.json().catch(() => ({}))
  const cpf = String(body?.cpf || '').replace(/\D/g, '')
  const email = String(body?.email || '').trim()
  const codcliente = String(body?.codcliente || '').trim()
  if (cpf.length !== 11) {
    return NextResponse.json({ error: 'CPF inválido. Informe 11 dígitos.' }, { status: 400 })
  }
  if (!email) {
    return NextResponse.json({ error: 'Informe um e-mail.' }, { status: 400 })
  }
  if (!codcliente) {
    return NextResponse.json({ error: 'Informe o contrato (codcliente).' }, { status: 400 })
  }

  return proxy('PUT', `/support/clients/${cpf}/email`, { email, codcliente })
}
