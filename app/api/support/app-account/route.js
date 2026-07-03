import { NextResponse } from 'next/server'
import { requireAuth, proxy } from '@/lib/api'

// GET /api/support/app-account?cpf=<cpf>  → consulta se existe conta do app
export async function GET(req) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const cpf = (searchParams.get('cpf') || '').replace(/\D/g, '')
  if (cpf.length !== 11) {
    return NextResponse.json({ error: 'CPF inválido. Informe 11 dígitos.' }, { status: 400 })
  }

  return proxy('GET', `/support/clients/${cpf}/app-account`)
}

// DELETE /api/support/app-account?cpf=<cpf>  → exclui a conta do app (destrutivo)
export async function DELETE(req) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const cpf = (searchParams.get('cpf') || '').replace(/\D/g, '')
  if (cpf.length !== 11) {
    return NextResponse.json({ error: 'CPF inválido. Informe 11 dígitos.' }, { status: 400 })
  }

  return proxy('DELETE', `/support/clients/${cpf}/app-account`)
}
