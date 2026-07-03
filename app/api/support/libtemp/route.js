import { NextResponse } from 'next/server'
import { requireAuth, proxy } from '@/lib/api'

// GET /api/support/libtemp?codcliente=<codcliente>  → consulta a liberação
export async function GET(req) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const codcliente = (searchParams.get('codcliente') || '').trim()
  if (!codcliente) {
    return NextResponse.json({ error: 'Informe o código do cliente.' }, { status: 400 })
  }

  return proxy('GET', `/support/clients/${encodeURIComponent(codcliente)}/libtemp`)
}

// POST /api/support/libtemp  body: { codcliente, prazo }  → cria a liberação
export async function POST(req) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const body = await req.json().catch(() => ({}))
  const codcliente = String(body?.codcliente || '').trim()
  const prazo = Number(body?.prazo)
  if (!codcliente) {
    return NextResponse.json({ error: 'Informe o código do cliente.' }, { status: 400 })
  }
  if (!prazo || prazo < 1) {
    return NextResponse.json({ error: 'Informe um prazo em dias válido.' }, { status: 400 })
  }

  return proxy('POST', `/support/clients/${encodeURIComponent(codcliente)}/libtemp`, { prazo })
}
