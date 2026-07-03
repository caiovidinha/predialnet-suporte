import { NextResponse } from 'next/server'
import { requireAuth, proxy } from '@/lib/api'

// GET /api/support/overview?credential=<cpf|codcliente>
export async function GET(req) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const credential = (searchParams.get('credential') || '').trim()
  if (!credential) {
    return NextResponse.json({ error: 'Informe um CPF ou código de cliente.' }, { status: 400 })
  }

  return proxy('GET', `/support/clients/${encodeURIComponent(credential)}/overview`)
}
