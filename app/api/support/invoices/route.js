import { NextResponse } from 'next/server'
import { requireAuth, proxy } from '@/lib/api'

// GET /api/support/invoices?codcliente=<codcliente>
export async function GET(req) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const codcliente = (searchParams.get('codcliente') || '').trim()
  if (!codcliente) {
    return NextResponse.json({ error: 'Informe o código do cliente.' }, { status: 400 })
  }

  return proxy('GET', `/support/clients/${encodeURIComponent(codcliente)}/invoices`)
}
